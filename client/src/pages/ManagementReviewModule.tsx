import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList, Plus, Trash2, Bot, ChevronRight, ArrowLeft,
  CheckCircle, Clock, AlertTriangle, AlertCircle, Circle, Loader2, Calendar, Users,
  BarChart2, ChevronDown, ChevronUp, ExternalLink, Presentation,
} from "lucide-react";
import { generateMgmtReviewPptx } from "@/lib/mgmtReviewPptx";
import type { IsoManagementReview, IsoReviewActionItem, IsoObjective, IsoKpiActual, InsertIsoManagementReview, InsertIsoReviewActionItem } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── Agenda Template Types ────────────────────────────────────────────────────
type AgendaTemplateItem = {
  clause: string;
  title: string;
  group: "input" | "output";
  section: string;
  frequency: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ISO 9001:2015  9.3 Management Review Template
// Source: FM-9.3-1 Management Review Agenda PDF
// ─────────────────────────────────────────────────────────────────────────────
const ISO_9001_AGENDA_ITEMS: AgendaTemplateItem[] = [
  // 9.3.2(a) Previous Review
  { clause: "9.3.2(a)", title: "Follow-up on open issues from previous management review", group: "input", section: "Previous Management Review — 9.3.2(a)", frequency: "Quarterly" },

  // 9.3.2(b) External/Internal Issues
  { clause: "9.3.2(b)-issues", title: "Changes in external and internal issues relevant to the QMS (4.1)", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Annually" },
  { clause: "9.3.2(b)-parties", title: "Review of Interested Parties Matrix (4.2) — needs and expectations", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Annually" },

  // 9.3.2(c-i) Customer Satisfaction
  { clause: "9.3.2(c-i)-scorecards", title: "Customer Scorecards", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Quarterly" },
  { clause: "9.3.2(c-i)-survey", title: "Customer Satisfaction Survey results", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Annually" },
  { clause: "9.3.2(c-i)-visits", title: "Customer Feedback from visits / complaints / portal reviews", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Quarterly" },

  // 9.3.2(c-ii) Quality Objectives
  { clause: "9.3.2(c-ii)-objectives", title: "Extent to which quality objectives have been met", group: "input", section: "Quality Objectives Achievement — 9.3.2(c-ii)", frequency: "Quarterly" },

  // 9.3.2(c-iii) KPI Dashboard by Department
  { clause: "9.3.2(c-iii)-sales", title: "Sales KPI (quote hit rate, new business pipeline)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-purchasing", title: "Purchasing KPI (supplier scorecards, on-time PO delivery)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-warehousing", title: "Warehousing KPI (order fulfillment accuracy, inventory compliance)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-logistics", title: "Logistics KPI (on-time delivery / OTD rate)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-qa", title: "QA KPI (calibration on schedule, inspection results)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-training", title: "Training KPI (completion rate, overdue sessions)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-audits", title: "Internal Audits KPI (completion to schedule, findings closure)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-mgmt", title: "Management / Improvement KPI (customer complaints, improvement actions)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-car", title: "Corrective Action KPI (repeat NCs, CAR closure rate)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-doc", title: "Document / Record Control KPI (non-conformities, overdue reviews)", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },

  // 9.3.2(c-iv) Nonconformities & Corrective Actions
  { clause: "9.3.2(c-iv)-cars", title: "Nonconformities and corrective action status — past due CARs", group: "input", section: "Nonconformities & Corrective Actions — 9.3.2(c-iv)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iv)-trends", title: "NC trend analysis — repeat nonconformances, systemic issues", group: "input", section: "Nonconformities & Corrective Actions — 9.3.2(c-iv)", frequency: "Quarterly" },

  // 9.3.2(c-v) Monitoring & Measurement
  { clause: "9.3.2(c-v)-results", title: "Monitoring and measurement results (process performance data)", group: "input", section: "Monitoring & Measurement Results — 9.3.2(c-v)", frequency: "Quarterly" },

  // 9.3.2(c-vi) Audit Results
  { clause: "9.3.2(c-vi)-ia", title: "Internal audit review results — findings, NCs, OFIs, closure status", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Bi-Annually" },
  { clause: "9.3.2(c-vi)-ea1", title: "External audit schedule review — upcoming certification/surveillance audits", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Annually" },
  { clause: "9.3.2(c-vi)-ea2", title: "External audit findings and corrective action status", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Annually" },

  // 9.3.2(c-vii) Supplier Performance
  { clause: "9.3.2(c-vii)-1", title: "Supplier performance — scorecard summary (quality, delivery, cost)", group: "input", section: "Supplier / External Provider Performance — 9.3.2(c-vii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vii)-2", title: "Supplier CARs — open items, chargebacks, escalation status", group: "input", section: "Supplier / External Provider Performance — 9.3.2(c-vii)", frequency: "Quarterly" },

  // New Business Update
  { clause: "nb-quotes", title: "Quotes — potential new customers and business development pipeline", group: "input", section: "New Business Update", frequency: "Quarterly" },

  // 9.3.2(d) Adequacy of Resources
  { clause: "9.3.2(d)-1", title: "Talent — personnel, open positions, skills gaps, training matrix", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },
  { clause: "9.3.2(d)-2", title: "Infrastructure, equipment, technology and financial resources", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },

  // 9.3.2(e) Risk & Opportunities
  { clause: "9.3.2(e)-1", title: "Effectiveness of actions taken to address risks and opportunities", group: "input", section: "Risks & Opportunities Effectiveness — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-2", title: "Contingency plan review", group: "input", section: "Risks & Opportunities Effectiveness — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-3", title: "Interested parties review — changes in needs/expectations", group: "input", section: "Risks & Opportunities Effectiveness — 9.3.2(e)", frequency: "Annually" },

  // Quality Policy Review
  { clause: "qpr-suitability", title: "Quality policy suitability — remains aligned with strategic direction?", group: "input", section: "Quality Policy Review — 5.2", frequency: "Annually" },

  // Changes to KPIs/Objectives
  { clause: "kpi-changes", title: "KPI targets and quality objectives — suitability for next period", group: "input", section: "Changes to KPIs / Objectives", frequency: "Annually" },

  // 9.3.2(f) Opportunities for Improvement
  { clause: "9.3.2(f)", title: "Open discussion — opportunities for improvement across the QMS", group: "input", section: "Opportunities for Improvement — 9.3.2(f)", frequency: "Annually" },

  // Required Outputs — 9.3.3
  { clause: "9.3.3(a)", title: "Decisions and actions: Opportunities for improvement of QMS effectiveness", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(b)", title: "Decisions and actions: Any need for changes to the QMS", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(c)", title: "Decisions and actions: Resource needs identified", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// IATF 16949  9.3 Management Review Template (Monthly + IATF-specific inputs)
// Source: IATF Management Review Agenda PDF
// ─────────────────────────────────────────────────────────────────────────────
const IATF_16949_AGENDA_ITEMS: AgendaTemplateItem[] = [
  { clause: "9.3.2(a)", title: "Follow-up on open issues from previous management review", group: "input", section: "Previous Management Review — 9.3.2(a)", frequency: "Monthly" },

  { clause: "9.3.2(b)-issues", title: "Changes in external and internal issues relevant to the QMS (4.1)", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Quarterly" },
  { clause: "9.3.2(b)-parties", title: "Review of Interested Parties Matrix (4.2) — needs and expectations", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Quarterly" },

  { clause: "9.3.2(c-i)-scorecards", title: "Customer Scorecards (all customer portals / report cards)", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Monthly" },
  { clause: "9.3.2(c-i)-survey", title: "Customer Satisfaction Survey results", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Annually" },
  { clause: "9.3.2(c-i)-visits", title: "Customer Feedback from visits / complaints / portal reviews", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Quarterly" },

  { clause: "9.3.2(c-ii)-objectives", title: "Extent to which quality objectives have been met", group: "input", section: "Quality Objectives Achievement — 9.3.2(c-ii)", frequency: "Monthly" },

  // IATF-specific KPI Dashboard (9.3.2.1 automotive supplement)
  { clause: "9.3.2(c-iii)-quote-timing", title: "Quote Timing (positive to goal)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-quote-budget", title: "Quote to Budget (new business won)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-ppap", title: "On Time PPAP (program milestones)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-apqp", title: "APQP on Budget (program cost vs. budget)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-scrap", title: "Scrap Cost (rolling 12-month target %)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-copq", title: "COPQ — Cost of Poor Quality (rework, returns, warranty)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-supplier-scrap", title: "Supplier Scrap (vendor quality performance)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-supplier-cost", title: "Supplier Cost Reductions (goal vs. actual savings)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-otd", title: "On Time Delivery (OTD) — by plant / customer", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-premium-freight", title: "Premium Freight (cost and root cause trends)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-pm-schedule", title: "On Time to PM Schedule (preventive maintenance compliance)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-calibrations", title: "On Time Calibrations (gage/equipment calibration compliance)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-turnover", title: "Employee Turnover (by plant)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-inventory", title: "Inventory Accuracy (cycle count results)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-lost-time", title: "Lost Time (safety — days without lost-time incident)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & IATF 9.3.2.1", frequency: "Monthly" },

  { clause: "9.3.2(c-iv)-cars", title: "Past due CARs / Completion Status", group: "input", section: "Nonconformities & Corrective Actions — 9.3.2(c-iv)", frequency: "Monthly" },
  { clause: "9.3.2(c-iv)-trends", title: "NC trend analysis — repeat nonconformances, systemic issues", group: "input", section: "Nonconformities & Corrective Actions — 9.3.2(c-iv)", frequency: "Monthly" },

  { clause: "9.3.2(c-v)-results", title: "Monitoring and measurement results (process performance data)", group: "input", section: "Monitoring & Measurement Results — 9.3.2(c-v)", frequency: "Monthly" },

  { clause: "9.3.2(c-vi)-ia", title: "Internal audit review results — findings, NCs, OFIs", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vi)-lpa-results", title: "LPA (Layered Process Audit) results by level", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vi)-lpa-metrics", title: "LPA metrics — level completion rate, findings trends", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vi)-ea1", title: "External audit schedule review — upcoming certification/surveillance audits", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Annually" },
  { clause: "9.3.2(c-vi)-ea2", title: "External audit findings and corrective action status", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Annually" },

  { clause: "9.3.2(c-vii)-assess", title: "Supplier Assessment / Audit results (new assessments, re-evaluations)", group: "input", section: "Supplier / External Provider Performance — 9.3.2(c-vii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vii)-1", title: "Supplier performance — scorecard summary (quality, delivery, cost)", group: "input", section: "Supplier / External Provider Performance — 9.3.2(c-vii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vii)-2", title: "Supplier CARs — open items, chargebacks, escalation status", group: "input", section: "Supplier / External Provider Performance — 9.3.2(c-vii)", frequency: "Quarterly" },

  { clause: "nb-quotes", title: "New business — quotes submitted, RFQs, customer pipeline", group: "input", section: "New Business Update", frequency: "Quarterly" },

  // IATF Manufacturing Assessment 9.3.2.1
  { clause: "iatf-fmea", title: "FMEA Review — PFMEA open actions, updated risk ratings", group: "input", section: "Manufacturing Assessment — IATF 9.3.2.1", frequency: "Monthly" },
  { clause: "iatf-feasibility", title: "Feasibility or Capacity Concern review (quoting & mfg phases)", group: "input", section: "Manufacturing Assessment — IATF 9.3.2.1", frequency: "Monthly" },

  { clause: "9.3.2(d)-1", title: "Talent — personnel, open positions, skills gaps", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },
  { clause: "9.3.2(d)-2", title: "Infrastructure, equipment, technology upgrades", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },

  { clause: "9.3.2(e)-1", title: "Effectiveness of actions taken to address risks and opportunities", group: "input", section: "Risks & Opportunities Effectiveness — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-2", title: "Contingency plan review", group: "input", section: "Risks & Opportunities Effectiveness — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-3", title: "Interested parties review", group: "input", section: "Risks & Opportunities Effectiveness — 9.3.2(e)", frequency: "Annually" },

  { clause: "qpr-suitability", title: "Quality policy suitability — aligned with strategic direction?", group: "input", section: "Quality Policy Review — 5.2", frequency: "Annually" },
  { clause: "kpi-changes", title: "KPI targets and quality objectives — suitability for next period", group: "input", section: "Changes to KPIs / Objectives", frequency: "Annually" },
  { clause: "9.3.2(f)", title: "Open discussion — opportunities for improvement across the QMS", group: "input", section: "Opportunities for Improvement — 9.3.2(f)", frequency: "Annually" },

  { clause: "9.3.3(a)", title: "Decisions and actions: Opportunities for improvement of QMS effectiveness", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(b)", title: "Decisions and actions: Any need for changes to the QMS", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(c)", title: "Decisions and actions: Resource needs identified", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ISO 14001:2015  9.3 Management Review Template (Environmental)
// ─────────────────────────────────────────────────────────────────────────────
const ISO_14001_AGENDA_ITEMS: AgendaTemplateItem[] = [
  { clause: "14.9.3(a)", title: "Follow-up on actions from previous management reviews", group: "input", section: "Previous Management Review — 9.3(a)", frequency: "Quarterly" },

  { clause: "14.9.3(b)-issues", title: "Changes in external/internal issues relevant to the EMS (4.1)", group: "input", section: "Changes in Context — 9.3(b)", frequency: "Annually" },
  { clause: "14.9.3(b)-parties", title: "Changes in needs and expectations of interested parties, including compliance obligations (4.2)", group: "input", section: "Changes in Context — 9.3(b)", frequency: "Annually" },
  { clause: "14.9.3(b)-aspects", title: "Changes in significant environmental aspects (new/modified operations)", group: "input", section: "Changes in Context — 9.3(b)", frequency: "Annually" },
  { clause: "14.9.3(b)-risks", title: "Changes in risks and opportunities (risk register updates)", group: "input", section: "Changes in Context — 9.3(b)", frequency: "Annually" },

  { clause: "14.9.3(c)-objectives", title: "Extent to which environmental objectives have been achieved", group: "input", section: "Environmental Objectives Achievement — 9.3(c)", frequency: "Quarterly" },

  { clause: "14.9.3(d)-ncs", title: "Environmental nonconformities and corrective actions (trend review)", group: "input", section: "Environmental Performance Information — 9.3(d)", frequency: "Quarterly" },
  { clause: "14.9.3(d)-monitoring", title: "Environmental monitoring and measurement results (emissions, waste, water, energy)", group: "input", section: "Environmental Performance Information — 9.3(d)", frequency: "Quarterly" },
  { clause: "14.9.3(d)-compliance", title: "Fulfillment of compliance obligations (legal, regulatory, permit requirements)", group: "input", section: "Environmental Performance Information — 9.3(d)", frequency: "Quarterly" },
  { clause: "14.9.3(d)-audits", title: "Audit results (internal EMS audits, external/regulatory audits)", group: "input", section: "Environmental Performance Information — 9.3(d)", frequency: "Bi-Annually" },

  { clause: "14.9.3(e)-resources", title: "Adequacy of resources for maintaining the EMS", group: "input", section: "Adequacy of Resources — 9.3(e)", frequency: "Quarterly" },

  { clause: "14.9.3(f)-comms", title: "Relevant communications from interested parties, including complaints (environmental grievances)", group: "input", section: "Stakeholder Communications — 9.3(f)", frequency: "Quarterly" },

  { clause: "14.9.3(g)", title: "Opportunities for continual improvement of EMS performance", group: "input", section: "Opportunities for Continual Improvement — 9.3(g)", frequency: "Annually" },

  { clause: "14.9.3-out-a", title: "Conclusions on continuing suitability, adequacy and effectiveness of the EMS", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "14.9.3-out-b", title: "Decisions related to continual improvement opportunities", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "14.9.3-out-c", title: "Actions related to any need for changes to the EMS, including resources", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "14.9.3-out-d", title: "Actions needed when environmental objectives have not been achieved", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "14.9.3-out-e", title: "Opportunities to improve integration of EMS with other business processes", group: "output", section: "Required Outputs — 9.3", frequency: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ISO 45001:2018  9.3 Management Review Template (Occupational Health & Safety)
// ─────────────────────────────────────────────────────────────────────────────
const ISO_45001_AGENDA_ITEMS: AgendaTemplateItem[] = [
  { clause: "45.9.3(a)", title: "Follow-up on actions from previous management reviews", group: "input", section: "Previous Management Review — 9.3(a)", frequency: "Quarterly" },

  { clause: "45.9.3(b)", title: "Changes in external and internal issues relevant to the OH&S MS (4.1, 4.2)", group: "input", section: "Changes in Context — 9.3(b)", frequency: "Annually" },

  { clause: "45.9.3(c)-policy", title: "Extent to which the OH&S policy has been fulfilled", group: "input", section: "OH&S Policy & Objectives Fulfillment — 9.3(c)", frequency: "Annually" },
  { clause: "45.9.3(c)-objectives", title: "Extent to which OH&S objectives have been achieved", group: "input", section: "OH&S Policy & Objectives Fulfillment — 9.3(c)", frequency: "Quarterly" },

  { clause: "45.9.3(d)-incidents", title: "Incidents, nonconformities, corrective actions and continual improvement (trend analysis)", group: "input", section: "OH&S Performance Information — 9.3(d)", frequency: "Quarterly" },
  { clause: "45.9.3(d)-monitoring", title: "Monitoring and measurement results (leading and lagging indicators)", group: "input", section: "OH&S Performance Information — 9.3(d)", frequency: "Quarterly" },
  { clause: "45.9.3(d)-compliance", title: "Evaluation of compliance with legal requirements and other OH&S requirements", group: "input", section: "OH&S Performance Information — 9.3(d)", frequency: "Quarterly" },
  { clause: "45.9.3(d)-audits", title: "Audit results (internal OH&S audits, external/regulatory inspections)", group: "input", section: "OH&S Performance Information — 9.3(d)", frequency: "Bi-Annually" },
  { clause: "45.9.3(d)-participation", title: "Consultation and participation of workers in OH&S decisions", group: "input", section: "OH&S Performance Information — 9.3(d)", frequency: "Quarterly" },
  { clause: "45.9.3(d)-risks", title: "Risks and opportunities — hazard identification results, risk register status", group: "input", section: "OH&S Performance Information — 9.3(d)", frequency: "Quarterly" },

  { clause: "45.9.3(e)-kpi-lti", title: "Lost Time Injuries (LTI) and Lost Time Injury Rate (LTIR)", group: "input", section: "OH&S KPI Dashboard", frequency: "Monthly" },
  { clause: "45.9.3(e)-kpi-trir", title: "Total Recordable Incident Rate (TRIR) — OSHA 300 Log summary", group: "input", section: "OH&S KPI Dashboard", frequency: "Monthly" },
  { clause: "45.9.3(e)-kpi-near-miss", title: "Near Miss Reports — count, trend, and actions taken", group: "input", section: "OH&S KPI Dashboard", frequency: "Monthly" },
  { clause: "45.9.3(e)-kpi-training", title: "Safety Training Completion Rate", group: "input", section: "OH&S KPI Dashboard", frequency: "Monthly" },
  { clause: "45.9.3(e)-kpi-hazards", title: "Hazard Reports Submitted and Closed (leading indicator)", group: "input", section: "OH&S KPI Dashboard", frequency: "Monthly" },
  { clause: "45.9.3(e)-kpi-inspections", title: "Safety Inspections / Workplace Assessments completed vs. scheduled", group: "input", section: "OH&S KPI Dashboard", frequency: "Quarterly" },

  { clause: "45.9.3(e)-resources", title: "Adequacy of resources for maintaining an effective OH&S MS", group: "input", section: "Adequacy of Resources — 9.3(e)", frequency: "Quarterly" },

  { clause: "45.9.3(f)-comms", title: "Relevant communication with interested parties — regulatory, worker concerns", group: "input", section: "Stakeholder Communications — 9.3(f)", frequency: "Quarterly" },
  { clause: "45.9.3(f)-legal", title: "New or revised legal and regulatory OH&S requirements", group: "input", section: "Stakeholder Communications — 9.3(f)", frequency: "Quarterly" },

  { clause: "45.9.3(g)", title: "Opportunities for continual improvement of OH&S performance", group: "input", section: "Opportunities for Continual Improvement — 9.3(g)", frequency: "Annually" },

  { clause: "45.9.3-out-a", title: "Conclusions on continuing suitability, adequacy and effectiveness of OH&S MS", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "45.9.3-out-b", title: "Continual improvement opportunities identified", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "45.9.3-out-c", title: "Any changes needed to the OH&S policy, objectives, or other OH&S MS elements", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "45.9.3-out-d", title: "Resources needed to maintain the OH&S MS", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "45.9.3-out-e", title: "Actions needed when OH&S objectives have not been achieved", group: "output", section: "Required Outputs — 9.3", frequency: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ISO 13485:2016  5.6 Management Review Template (Medical Devices)
// Note: ISO 13485 uses 5.6 (not 9.3) for management review
// ─────────────────────────────────────────────────────────────────────────────
const ISO_13485_AGENDA_ITEMS: AgendaTemplateItem[] = [
  { clause: "5.6.1-prev", title: "Follow-up on actions from previous management reviews (5.6.1)", group: "input", section: "Previous Management Review — 5.6.1", frequency: "Annually" },

  { clause: "5.6.2(a)-feedback", title: "Customer feedback — complaints, advisory notices, MDR/vigilance reports", group: "input", section: "Customer Feedback — 5.6.2(a)", frequency: "Quarterly" },
  { clause: "5.6.2(a)-csat", title: "Customer satisfaction survey results and trends", group: "input", section: "Customer Feedback — 5.6.2(a)", frequency: "Annually" },

  { clause: "5.6.2(b)-complaints", title: "Complaint handling — open complaints, trends, MDR reporting status", group: "input", section: "Complaint Handling — 5.6.2(b)", frequency: "Quarterly" },

  { clause: "5.6.2(c)-regulatory", title: "Reporting to regulatory authorities — MDR/vigilance filings, FDA 510(k), CE/MDD submissions", group: "input", section: "Regulatory Reporting — 5.6.2(c)", frequency: "Quarterly" },

  { clause: "5.6.2(d)-ia", title: "Internal audit results — findings, NCs, OFIs, closure status", group: "input", section: "Audit Results — 5.6.2(d)", frequency: "Annually" },
  { clause: "5.6.2(d)-ea", title: "External audit results — notified body, registrar, regulatory inspections", group: "input", section: "Audit Results — 5.6.2(d)", frequency: "Annually" },

  { clause: "5.6.2(e)-processes", title: "Monitoring and measurement of processes — process capability, control chart results", group: "input", section: "Process Monitoring & Measurement — 5.6.2(e)", frequency: "Quarterly" },

  { clause: "5.6.2(f)-nc-product", title: "Nonconforming product — scope, disposition, CAPA status", group: "input", section: "Nonconforming Product — 5.6.2(f)", frequency: "Quarterly" },

  { clause: "5.6.2(g)-ca", title: "Corrective action status — open CARs, effectiveness reviews, repeat NCs", group: "input", section: "Corrective & Preventive Actions — 5.6.2(g)", frequency: "Quarterly" },
  { clause: "5.6.2(g)-pa", title: "Preventive action status — risk-identified PAs, trend-based actions", group: "input", section: "Corrective & Preventive Actions — 5.6.2(g)", frequency: "Quarterly" },

  { clause: "5.6.2(h)-changes", title: "Changes that could affect the QMS — new regulations, product changes, design changes, supplier changes", group: "input", section: "Changes Affecting the QMS — 5.6.2(h)", frequency: "Quarterly" },

  { clause: "5.6.2(i)-improvement", title: "Recommendations for improvement across the QMS", group: "input", section: "Recommendations for Improvement — 5.6.2(i)", frequency: "Annually" },

  { clause: "5.6.2(j)-regulatory", title: "New or revised regulatory requirements affecting product or QMS", group: "input", section: "New/Revised Regulatory Requirements — 5.6.2(j)", frequency: "Quarterly" },

  { clause: "5.6.2-kpi-oee", title: "Process KPIs — OEE, yield, defect rate, sterilization validation status", group: "input", section: "QMS Performance KPIs", frequency: "Quarterly" },
  { clause: "5.6.2-kpi-complaint-rate", title: "Complaint rate (per unit sold or per procedure)", group: "input", section: "QMS Performance KPIs", frequency: "Quarterly" },
  { clause: "5.6.2-kpi-mdr-rate", title: "MDR/vigilance reporting timeliness and count", group: "input", section: "QMS Performance KPIs", frequency: "Quarterly" },
  { clause: "5.6.2-kpi-supplier", title: "Supplier performance — quality, delivery, approved supplier list status", group: "input", section: "QMS Performance KPIs", frequency: "Quarterly" },
  { clause: "5.6.2-kpi-training", title: "Training compliance — personnel qualification, competency records", group: "input", section: "QMS Performance KPIs", frequency: "Quarterly" },

  { clause: "5.6.3-out-a", title: "Actions to maintain suitability, adequacy and effectiveness of the QMS", group: "output", section: "Required Outputs — 5.6.3", frequency: "" },
  { clause: "5.6.3-out-b", title: "Improvement of product to meet customer and regulatory requirements", group: "output", section: "Required Outputs — 5.6.3", frequency: "" },
  { clause: "5.6.3-out-c", title: "Resource needs — personnel, equipment, training, infrastructure", group: "output", section: "Required Outputs — 5.6.3", frequency: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// AS9100 Rev D  9.3 Management Review Template (Aerospace)
// Extends ISO 9001 9.3 with aerospace-specific inputs per 9.3.2.1
// ─────────────────────────────────────────────────────────────────────────────
const AS9100_AGENDA_ITEMS: AgendaTemplateItem[] = [
  { clause: "as.9.3.2(a)", title: "Follow-up on actions from previous management reviews", group: "input", section: "Previous Management Review — 9.3.2(a)", frequency: "Quarterly" },

  { clause: "as.9.3.2(b)-issues", title: "Changes in external/internal issues relevant to the QMS (4.1)", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Annually" },
  { clause: "as.9.3.2(b)-parties", title: "Changes in needs and expectations of interested parties (4.2)", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Annually" },

  { clause: "as.9.3.2(c-i)-scorecards", title: "Customer scorecards and satisfaction surveys (by customer)", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Quarterly" },
  { clause: "as.9.3.2(c-i)-complaints", title: "Customer complaints — warranty claims, escapes, corrective requests", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Quarterly" },
  { clause: "as.9.3.2(c-i)-feedback", title: "Customer feedback from surveys, visits, and program reviews", group: "input", section: "Customer Satisfaction & Feedback — 9.3.2(c-i)", frequency: "Quarterly" },

  { clause: "as.9.3.2(c-ii)-objectives", title: "Extent to which quality objectives have been achieved", group: "input", section: "Quality Objectives Achievement — 9.3.2(c-ii)", frequency: "Quarterly" },

  { clause: "as.9.3.2(c-iii)-otd", title: "On Time Delivery (OTD) — by customer and program", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Monthly" },
  { clause: "as.9.3.2(c-iii)-quality-escape", title: "Quality escapes (defects shipped to customer, PPM)", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Monthly" },
  { clause: "as.9.3.2(c-iii)-scrap", title: "Scrap cost and yield trends", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Monthly" },
  { clause: "as.9.3.2(c-iii)-rework", title: "Rework — hours and cost trends", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Monthly" },
  { clause: "as.9.3.2(c-iii)-supplier", title: "Supplier quality performance (PPM, OTD, approved source list)", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "as.9.3.2(c-iii)-training", title: "Training completion and personnel certification status", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "as.9.3.2(c-iii)-audits-kpi", title: "Internal audit schedule compliance and findings trend", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "as.9.3.2(c-iii)-first-pass", title: "First Pass Yield (FPY) by process/product", group: "input", section: "Aerospace KPI Dashboard — 9.3.2(c-iii)", frequency: "Monthly" },

  { clause: "as.9.3.2(c-iv)-cars", title: "Nonconformities and corrective action status — past due CARs", group: "input", section: "Nonconformities & Corrective Actions — 9.3.2(c-iv)", frequency: "Quarterly" },
  { clause: "as.9.3.2(c-iv)-trends", title: "NC trend analysis — repeat nonconformances, systemic issues", group: "input", section: "Nonconformities & Corrective Actions — 9.3.2(c-iv)", frequency: "Quarterly" },

  { clause: "as.9.3.2(c-v)-results", title: "Monitoring and measurement results — process capability, SPC charts", group: "input", section: "Monitoring & Measurement Results — 9.3.2(c-v)", frequency: "Quarterly" },

  { clause: "as.9.3.2(c-vi)-ia", title: "Internal audit results — AS9100 clause-by-clause findings", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Bi-Annually" },
  { clause: "as.9.3.2(c-vi)-ea", title: "External/Registrar audit schedule and findings status", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Annually" },
  { clause: "as.9.3.2(c-vi)-customer-audit", title: "Customer source inspections / delegated quality audits", group: "input", section: "Audit Results — 9.3.2(c-vi)", frequency: "Quarterly" },

  { clause: "as.9.3.2(c-vii)-1", title: "Supplier performance — scorecard summary and approved supplier list review", group: "input", section: "Supplier / External Provider Performance — 9.3.2(c-vii)", frequency: "Quarterly" },
  { clause: "as.9.3.2(c-vii)-2", title: "Supplier CARs and corrective action status", group: "input", section: "Supplier / External Provider Performance — 9.3.2(c-vii)", frequency: "Quarterly" },

  { clause: "as.9.3.2-risk", title: "Operational risk management — risk register status, mitigations effectiveness", group: "input", section: "Risk Management Review — AS9100 9.3.2", frequency: "Quarterly" },
  { clause: "as.9.3.2-safety", title: "Safety-related product/process issues and actions", group: "input", section: "Risk Management Review — AS9100 9.3.2", frequency: "Quarterly" },
  { clause: "as.9.3.2-config", title: "Configuration management effectiveness review", group: "input", section: "Risk Management Review — AS9100 9.3.2", frequency: "Annually" },

  { clause: "as.9.3.2(d)-1", title: "Talent — personnel, certifications, skills gaps", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Quarterly" },
  { clause: "as.9.3.2(d)-2", title: "Infrastructure, tooling, special process equipment adequacy", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Quarterly" },

  { clause: "as.9.3.2(e)", title: "Effectiveness of actions taken to address risks and opportunities", group: "input", section: "Risks & Opportunities Effectiveness — 9.3.2(e)", frequency: "Annually" },

  { clause: "as.9.3.2(f)", title: "Opportunities for continual improvement across the QMS", group: "input", section: "Opportunities for Improvement — 9.3.2(f)", frequency: "Annually" },

  { clause: "as.9.3.3(a)", title: "Decisions and actions: Opportunities for improvement", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "as.9.3.3(b)", title: "Decisions and actions: Any need for changes to the QMS", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "as.9.3.3(c)", title: "Decisions and actions: Resource needs identified", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ISO 27001:2022  9.3 Management Review Template (Information Security)
// ─────────────────────────────────────────────────────────────────────────────
const ISO_27001_AGENDA_ITEMS: AgendaTemplateItem[] = [
  { clause: "27.9.3(a)", title: "Follow-up on actions from previous management reviews", group: "input", section: "Previous Management Review — 9.3(a)", frequency: "Annually" },

  { clause: "27.9.3(b)-issues", title: "Changes in external and internal issues relevant to the ISMS (4.1)", group: "input", section: "Changes in ISMS Context — 9.3(b)", frequency: "Annually" },
  { clause: "27.9.3(b)-parties", title: "Changes in needs and expectations of interested parties relevant to the ISMS (4.2)", group: "input", section: "Changes in ISMS Context — 9.3(b)", frequency: "Annually" },

  { clause: "27.9.3(c)-ncs", title: "Nonconformities and corrective actions (security incidents, deviations from SoA)", group: "input", section: "ISMS Performance Feedback — 9.3(c)", frequency: "Quarterly" },
  { clause: "27.9.3(c)-monitoring", title: "Monitoring and measurement results — security metrics, KPIs, control effectiveness", group: "input", section: "ISMS Performance Feedback — 9.3(c)", frequency: "Quarterly" },
  { clause: "27.9.3(c)-audits", title: "Internal audit results (ISMS controls, Annex A coverage)", group: "input", section: "ISMS Performance Feedback — 9.3(c)", frequency: "Annually" },
  { clause: "27.9.3(c)-objectives", title: "Fulfillment of information security objectives", group: "input", section: "ISMS Performance Feedback — 9.3(c)", frequency: "Quarterly" },

  { clause: "27.9.3-kpi-incidents", title: "Security Incidents — count, severity, MTTR (Mean Time to Resolve)", group: "input", section: "Information Security KPI Dashboard", frequency: "Monthly" },
  { clause: "27.9.3-kpi-vulnerabilities", title: "Vulnerability Management — open critical/high vulnerabilities, patch rate", group: "input", section: "Information Security KPI Dashboard", frequency: "Monthly" },
  { clause: "27.9.3-kpi-access", title: "Access Control Reviews — privileged access certifications, orphan accounts", group: "input", section: "Information Security KPI Dashboard", frequency: "Quarterly" },
  { clause: "27.9.3-kpi-training", title: "Security Awareness Training completion rate", group: "input", section: "Information Security KPI Dashboard", frequency: "Quarterly" },
  { clause: "27.9.3-kpi-phishing", title: "Phishing simulation results and trend", group: "input", section: "Information Security KPI Dashboard", frequency: "Quarterly" },
  { clause: "27.9.3-kpi-backups", title: "Backup success rates and recovery test results (BCP/DRP)", group: "input", section: "Information Security KPI Dashboard", frequency: "Quarterly" },
  { clause: "27.9.3-kpi-compliance", title: "Compliance obligations — GDPR, HIPAA, SOC 2, contractual requirements", group: "input", section: "Information Security KPI Dashboard", frequency: "Quarterly" },

  { clause: "27.9.3(d)-interested-parties", title: "Feedback from interested parties — customers, regulators, auditors", group: "input", section: "Feedback from Interested Parties — 9.3(d)", frequency: "Quarterly" },

  { clause: "27.9.3(e)-risk-assessment", title: "Results of risk assessment — updated risk register, residual risk acceptance", group: "input", section: "Risk Assessment & Treatment — 9.3(e)", frequency: "Annually" },
  { clause: "27.9.3(e)-risk-treatment", title: "Status of risk treatment plan — control implementation progress, SoA review", group: "input", section: "Risk Assessment & Treatment — 9.3(e)", frequency: "Annually" },
  { clause: "27.9.3(e)-third-party", title: "Third-party / supplier risk — vendor security assessments, contracts", group: "input", section: "Risk Assessment & Treatment — 9.3(e)", frequency: "Annually" },

  { clause: "27.9.3-resources", title: "Adequacy of resources for maintaining the ISMS", group: "input", section: "Adequacy of Resources", frequency: "Annually" },

  { clause: "27.9.3(f)", title: "Opportunities for continual improvement of the ISMS", group: "input", section: "Opportunities for Continual Improvement — 9.3(f)", frequency: "Annually" },

  { clause: "27.9.3-out-a", title: "Decisions related to continual improvement opportunities", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "27.9.3-out-b", title: "Any need for changes to the ISMS — policy, scope, controls, SoA", group: "output", section: "Required Outputs — 9.3", frequency: "" },
  { clause: "27.9.3-out-c", title: "Resource needs — personnel, technology, budget for ISMS improvements", group: "output", section: "Required Outputs — 9.3", frequency: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Template selector — returns the right template for any of the 7 standards
// ─────────────────────────────────────────────────────────────────────────────
function getAgendaTemplate(standard?: string | null): AgendaTemplateItem[] {
  const s = (standard ?? "").toUpperCase().replace(/[-:\s]/g, "");
  if (s.includes("IATF") || s.includes("16949")) return IATF_16949_AGENDA_ITEMS;
  if (s.includes("14001")) return ISO_14001_AGENDA_ITEMS;
  if (s.includes("45001")) return ISO_45001_AGENDA_ITEMS;
  if (s.includes("13485")) return ISO_13485_AGENDA_ITEMS;
  if (s.includes("AS9100") || s.includes("AS91")) return AS9100_AGENDA_ITEMS;
  if (s.includes("27001")) return ISO_27001_AGENDA_ITEMS;
  return ISO_9001_AGENDA_ITEMS; // default: ISO 9001
}

function getStandardLabel(standard?: string | null): string {
  const s = (standard ?? "").toUpperCase().replace(/[-:\s]/g, "");
  if (s.includes("IATF") || s.includes("16949")) return "IATF 16949";
  if (s.includes("14001")) return "ISO 14001:2015";
  if (s.includes("45001")) return "ISO 45001:2018";
  if (s.includes("13485")) return "ISO 13485:2016";
  if (s.includes("AS9100") || s.includes("AS91")) return "AS9100 Rev D";
  if (s.includes("27001")) return "ISO 27001:2022";
  return "ISO 9001:2015";
}

function getManagementClause(standard?: string | null): string {
  const s = (standard ?? "").toUpperCase().replace(/[-:\s]/g, "");
  if (s.includes("13485")) return "5.6";
  return "9.3";
}

// ─── AgendaItem (saved per-review state) ─────────────────────────────────────
type AgendaItem = {
  clause: string;
  title: string;
  covered: boolean;
  notes: string;
  kpiResponses?: Record<string, string>; // keyed by objectiveId as string → explanation text
};

function agendaFromReview(review: IsoManagementReview, template: AgendaTemplateItem[]): AgendaItem[] {
  const existing = (review.agendaItems as AgendaItem[] | null) ?? [];
  return template.map(item => {
    const found = existing.find(e => e.clause === item.clause);
    return {
      clause: item.clause,
      title: item.title,
      covered: found?.covered ?? false,
      notes: found?.notes ?? "",
      kpiResponses: found?.kpiResponses ?? {},
    };
  });
}

function offTrackStreakCount(actuals: IsoKpiActual[], targetVal: number): number {
  const sorted = [...actuals].sort((a, b) => b.period.localeCompare(a.period));
  let streak = 0;
  for (const a of sorted) {
    if (parseFloat(a.actual) < targetVal) streak++;
    else break;
  }
  return streak;
}

const TREND_THRESHOLD_KEY = "cchub_kpi_trend_threshold";
function loadTrendThreshold(): number {
  try { const v = parseInt(localStorage.getItem(TREND_THRESHOLD_KEY) ?? "3"); return [1, 2, 3].includes(v) ? v : 3; }
  catch { return 3; }
}
function saveTrendThreshold(n: number) {
  try { localStorage.setItem(TREND_THRESHOLD_KEY, String(n)); } catch { /* noop */ }
}

const ACTION_STATUS_CYCLE: Record<string, string> = { open: "in_progress", in_progress: "closed", closed: "open" };
const ACTION_STATUS_ICON = {
  open: <Circle className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Loader2 className="w-4 h-4 text-yellow-500" />,
  closed: <CheckCircle className="w-4 h-4 text-green-500" />,
};
const ACTION_STATUS_COLORS: Record<string, string> = {
  open: "bg-muted/30 border-border",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200",
  closed: "bg-green-50 dark:bg-green-900/10 border-green-200",
};
const FREQ_BADGE_COLORS: Record<string, string> = {
  "Monthly":     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Quarterly":   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Bi-Annually": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Annually":    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function FrequencyBadge({ frequency }: { frequency: string }) {
  if (!frequency) return null;
  const cls = FREQ_BADGE_COLORS[frequency] ?? "bg-muted text-muted-foreground";
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cls}`}>{frequency}</span>;
}

function KpiSparklineCard({ obj, actuals, trendThreshold = 3 }: { obj: IsoObjective; actuals: IsoKpiActual[]; trendThreshold?: number }) {
  const sorted = [...actuals].sort((a, b) => a.period.localeCompare(b.period));
  const targetVal = parseFloat(obj.target ?? "0");
  const latest = sorted[sorted.length - 1];
  const latestVal = latest ? parseFloat(latest.actual) : null;
  const pct = latestVal !== null && targetVal > 0 ? Math.min((latestVal / targetVal) * 100, 150) : null;
  const displayPct = pct !== null ? Math.min(pct, 100) : null;
  const streak = offTrackStreakCount(actuals, targetVal);
  const flagged = streak >= trendThreshold;
  const chartData = sorted.slice(-8).map(a => ({ period: a.period.slice(-7), actual: parseFloat(a.actual), target: targetVal }));
  const statusBorder = obj.status === "on_track" ? "border-green-400" : obj.status === "at_risk" ? "border-yellow-400" : "border-red-500";
  const statusBg = obj.status === "on_track" ? "bg-green-50 dark:bg-green-900/10" : obj.status === "at_risk" ? "bg-yellow-50 dark:bg-yellow-900/10" : "bg-red-50 dark:bg-red-900/10";
  const gaugeColor = obj.status === "on_track" ? "bg-green-500" : obj.status === "at_risk" ? "bg-yellow-500" : "bg-red-500";
  const lineColor = obj.status === "on_track" ? "#22c55e" : obj.status === "at_risk" ? "#f59e0b" : "#ef4444";
  const statusLabel = obj.status === "on_track" ? "On Track" : obj.status === "at_risk" ? "At Risk" : "Off Track";
  return (
    <Card className={`border-l-4 ${statusBorder} ${statusBg}`}>
      <CardContent className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground leading-tight">{obj.name}</span>
              {flagged && <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 font-semibold bg-red-100 px-1 rounded"><AlertTriangle className="w-2.5 h-2.5" /> {streak} off-track</span>}
            </div>
            {obj.processName && <div className="text-[10px] text-muted-foreground mt-0.5">{obj.processName}</div>}
          </div>
          <div className="text-right shrink-0">
            {latestVal !== null ? (
              <>
                <div className="text-base font-bold text-foreground leading-none">{latestVal}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{obj.unit}</span></div>
                <div className="text-[10px] text-muted-foreground">vs {obj.target} {obj.unit} target</div>
                <div className={`text-[10px] font-semibold mt-0.5 ${obj.status === "on_track" ? "text-green-600" : obj.status === "at_risk" ? "text-yellow-600" : "text-red-600"}`}>{statusLabel}</div>
              </>
            ) : <div className="text-[10px] text-muted-foreground italic mt-1">No data logged</div>}
          </div>
        </div>

        {/* Gauge bar */}
        {displayPct !== null && (
          <div>
            <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
              <span>0</span>
              <span className="text-[9px] font-medium">{pct!.toFixed(0)}% of target</span>
              <span>{obj.target} {obj.unit}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${gaugeColor}`} style={{ width: `${displayPct}%` }} />
            </div>
          </div>
        )}

        {/* Trend chart */}
        {chartData.length > 1 && (
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="period" tick={{ fontSize: 7 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 7 }} width={22} />
                <Tooltip contentStyle={{ fontSize: 9 }} formatter={(v: number) => [`${v} ${obj.unit}`, ""]} />
                <ReferenceLine y={targetVal} stroke="#f97316" strokeDasharray="3 2" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 7, fill: "#f97316" }} />
                <Line type="monotone" dataKey="actual" stroke={lineColor} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {chartData.length === 1 && latestVal !== null && (
          <div className="text-[10px] text-muted-foreground italic">Only 1 period logged — trend will appear as more data is added</div>
        )}
        {chartData.length === 0 && (
          <div className="text-[10px] text-muted-foreground italic">No measurements logged yet in Measurement & Monitoring module</div>
        )}
        {latest && <div className="text-[9px] text-muted-foreground text-right">Latest period: {latest.period}</div>}
      </CardContent>
    </Card>
  );
}

function isLiveDataSection(section: string): boolean {
  const s = section.toLowerCase();
  // Include objective/monitoring/measurement sections; exclude department-level KPI dashboard rows (manual)
  if (s.includes("kpi dashboard")) return false;
  return (
    s.includes("objective") ||
    s.includes("monitoring") ||
    s.includes("measurement") ||
    s.includes("performance kpi") ||
    s.includes("performance information") ||
    s.includes("process monitoring") ||
    s.includes("process performance")
  );
}

// ─── KPI Attention Strip ──────────────────────────────────────────────────────
// Shows at_risk / off_track objectives within a live data section.
// Two-tier response:
//   • Amber tier  — at_risk/off_track but streak < trendThreshold → explanation encouraged
//   • Red tier    — streak >= trendThreshold (negative trend confirmed) → explanation REQUIRED
//                   + corrective action REQUIRED (auto-prefills action register)
function KpiAttentionStrip({
  objectives, getActuals, agenda, setAgenda, onAddAction, anchorClause, trendThreshold = 3,
}: {
  objectives: IsoObjective[];
  getActuals: (id: number) => IsoKpiActual[];
  agenda: AgendaItem[];
  setAgenda: (updater: (prev: AgendaItem[]) => AgendaItem[]) => void;
  onAddAction: (description: string, owner: string) => void;
  anchorClause: string;
  trendThreshold?: number;
}) {
  const [expandedKpi, setExpandedKpi] = useState<number | null>(null);
  const [initiatedCa, setInitiatedCa] = useState<Set<number>>(new Set());

  const attention = objectives.filter(obj =>
    (obj.status === "at_risk" || obj.status === "off_track") && getActuals(obj.id).length > 0
  );

  const kpiResponses = agenda.find(a => a.clause === anchorClause)?.kpiResponses ?? {};

  const setKpiResponse = useCallback((objId: number, text: string) => {
    setAgenda(prev => prev.map(item =>
      item.clause === anchorClause
        ? { ...item, kpiResponses: { ...(item.kpiResponses ?? {}), [String(objId)]: text } }
        : item
    ));
  }, [anchorClause, setAgenda]);

  if (objectives.length === 0) return null;

  if (attention.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50/60 dark:bg-green-950/20 border-b border-green-200/60 dark:border-green-800/30 text-[11px] text-green-700 dark:text-green-400 font-medium">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" /> No KPIs with logged data require attention ✓
      </div>
    );
  }

  // Separate trend-triggered (CA required) from general attention
  const trendTriggered = attention.filter(obj => offTrackStreakCount(getActuals(obj.id), parseFloat(obj.target ?? "0")) >= trendThreshold);
  const generalAttention = attention.filter(obj => offTrackStreakCount(getActuals(obj.id), parseFloat(obj.target ?? "0")) < trendThreshold);

  const renderKpiRow = (obj: IsoObjective, isTrend: boolean) => {
    const acts = getActuals(obj.id);
    const sorted = [...acts].sort((a, b) => a.period.localeCompare(b.period));
    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const latestVal = latest ? parseFloat(latest.actual) : null;
    const prevVal = prev ? parseFloat(prev.actual) : null;
    const targetVal = parseFloat(obj.target ?? "0");
    const pct = latestVal !== null && targetVal > 0 ? (latestVal / targetVal) * 100 : null;
    const streak = offTrackStreakCount(acts, targetVal);
    const trend = latestVal === null || prevVal === null ? "none"
      : latestVal > prevVal ? "up" : latestVal < prevVal ? "down" : "flat";
    const isExpanded = expandedKpi === obj.id;
    const explanation = kpiResponses[String(obj.id)] ?? "";
    const caInitiated = initiatedCa.has(obj.id);
    const explanationMissing = isTrend && explanation.trim().length === 0;

    return (
      <div key={obj.id} className={`bg-background ${isTrend ? "border-l-2 border-red-500" : ""}`}>
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors ${isTrend ? "hover:bg-red-50/30 dark:hover:bg-red-950/20" : ""}`}
          onClick={() => setExpandedKpi(isExpanded ? null : obj.id)}
          data-testid={`button-kpi-attention-${obj.id}`}
        >
          {isTrend ? (
            <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <AlertTriangle className="w-2.5 h-2.5" /> {streak} neg. periods
            </span>
          ) : (
            <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${obj.status === "at_risk" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
              {obj.status === "at_risk" ? "At Risk" : "Off Track"}
            </span>
          )}
          <span className="flex-1 text-xs font-medium text-foreground truncate">{obj.name}</span>
          {latestVal !== null && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {latestVal} {obj.unit} / {obj.target} {obj.unit}
              {pct !== null && (
                <span className={`ml-1 font-semibold ${pct >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                  ({pct.toFixed(0)}%)
                </span>
              )}
            </span>
          )}
          {trend === "up" && <span className="shrink-0 text-green-600 text-sm font-bold" title="Trending up vs prior period">↑</span>}
          {trend === "down" && <span className="shrink-0 text-red-500 text-sm font-bold" title="Trending down vs prior period">↓</span>}
          {trend === "flat" && <span className="shrink-0 text-muted-foreground text-sm" title="No change vs prior period">→</span>}
          {isTrend && explanationMissing && !isExpanded && (
            <span className="shrink-0 text-[9px] text-red-600 font-semibold bg-red-50 dark:bg-red-950/30 px-1 py-0.5 rounded">Required</span>
          )}
          <span className="shrink-0 text-muted-foreground">
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </button>

        {isExpanded && (
          <div className={`px-3 pb-3 pt-1 space-y-2 ${isTrend ? "bg-red-50/40 dark:bg-red-950/15" : "bg-amber-50/40 dark:bg-amber-950/15"}`}>
            {isTrend && (
              <div className="flex items-start gap-1.5 text-[11px] text-red-700 dark:text-red-300 bg-red-100/60 dark:bg-red-900/30 rounded px-2 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Negative Trend Detected</strong> — {streak} consecutive periods below target ({trendThreshold} required to trigger).
                  An explanation and corrective action are <strong>required</strong>.
                </span>
              </div>
            )}
            <div>
              <Label className={`text-xs font-semibold ${isTrend ? "text-red-700 dark:text-red-400" : "text-foreground"}`}>
                {isTrend ? "Required: " : ""}Why is <span className="text-accent">{obj.name}</span> not meeting its target?
                {isTrend && explanationMissing && <span className="ml-1 text-red-500">*</span>}
              </Label>
              <Textarea
                value={explanation}
                onChange={e => setKpiResponse(obj.id, e.target.value)}
                placeholder={isTrend
                  ? "Required: Describe the root cause and contributing factors for this negative trend…"
                  : "Root cause, contributing factors, or explanation for missing target…"}
                rows={isTrend ? 3 : 2}
                className={`text-xs mt-1 ${isTrend && explanationMissing ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                data-testid={`textarea-kpi-explanation-${obj.id}`}
              />
            </div>
            {isTrend ? (
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className={`gap-1.5 h-7 text-xs ${caInitiated ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                  onClick={() => {
                    onAddAction(
                      `[TREND ALERT] Corrective action required — ${obj.name} missed target for ${streak} consecutive periods${latestVal !== null ? ` (latest: ${latestVal} ${obj.unit} vs ${obj.target} ${obj.unit} target)` : ""}`,
                      obj.responsible ?? ""
                    );
                    setInitiatedCa(prev => new Set([...prev, obj.id]));
                  }}
                  data-testid={`button-kpi-initiate-ca-${obj.id}`}
                >
                  {caInitiated ? <><CheckCircle className="w-3 h-3" /> CA Initiated ✓</> : <><Plus className="w-3 h-3" /> Initiate Corrective Action</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-xs"
                  onClick={() => onAddAction(
                    `Corrective action for ${obj.name}${latestVal !== null ? ` — ${latestVal} ${obj.unit} vs ${obj.target} ${obj.unit} target` : ""}`,
                    obj.responsible ?? ""
                  )}
                  data-testid={`button-kpi-add-action-${obj.id}`}
                >
                  <Plus className="w-3 h-3" /> Add to Action Register
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs border-accent text-accent hover:bg-accent/10"
                onClick={() => onAddAction(
                  `Corrective action for ${obj.name}${latestVal !== null ? ` — ${latestVal} ${obj.unit} vs ${obj.target} ${obj.unit} target` : ""}`,
                  obj.responsible ?? ""
                )}
                data-testid={`button-kpi-add-action-${obj.id}`}
              >
                <Plus className="w-3 h-3" /> Add to Action Register
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-b border-border/60">
      {/* Trend-triggered (CA required) */}
      {trendTriggered.length > 0 && (
        <>
          <div className="px-3 py-1.5 bg-red-50/80 dark:bg-red-950/30 flex items-center gap-1.5 border-b border-red-200/60 dark:border-red-800/40">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-[11px] font-bold text-red-700 dark:text-red-300">
              {trendTriggered.length} KPI{trendTriggered.length > 1 ? "s" : ""} — Negative Trend Confirmed ({trendThreshold}+ consecutive periods) — Corrective Action Required
            </span>
          </div>
          <div className="divide-y divide-border/40">
            {trendTriggered.map(obj => renderKpiRow(obj, true))}
          </div>
        </>
      )}
      {/* General attention (amber) */}
      {generalAttention.length > 0 && (
        <>
          <div className="px-3 py-1.5 bg-amber-50/70 dark:bg-amber-950/25 flex items-center gap-1.5 border-b border-amber-200/60 dark:border-amber-800/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {generalAttention.length} KPI{generalAttention.length > 1 ? "s" : ""} Require Attention — explanation &amp; action recommended
            </span>
          </div>
          <div className="divide-y divide-border/40">
            {generalAttention.map(obj => renderKpiRow(obj, false))}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewDetail({
  review, allReviews, onBack, isoProjectId, standard, onGoToMeasurement,
}: { review: IsoManagementReview; allReviews: IsoManagementReview[]; onBack: () => void; isoProjectId?: number; standard?: string | null; onGoToMeasurement?: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const template = getAgendaTemplate(standard);
  const standardLabel = getStandardLabel(standard);
  const clause = getManagementClause(standard);
  // Stable anchor for kpiResponses storage — template's first clause for this standard
  const kpiResponsesAnchorClause = template[0]?.clause ?? "";
  const [agenda, setAgenda] = useState<AgendaItem[]>(agendaFromReview(review, template));
  const [actionForm, setActionForm] = useState({ description: "", owner: "", dueDate: "" });
  const [showActionForm, setShowActionForm] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [trendThreshold, setTrendThreshold] = useState<number>(loadTrendThreshold);
  const [generatingPptx, setGeneratingPptx] = useState(false);
  const actionRegisterRef = useRef<HTMLDivElement>(null);

  const handleTrendThresholdChange = (n: number) => {
    setTrendThreshold(n);
    saveTrendThreshold(n);
  };

  const prefillAction = useCallback((description: string, owner: string) => {
    setActionForm(f => ({ ...f, description, owner }));
    setShowActionForm(true);
    setTimeout(() => {
      actionRegisterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const { data: actions = [] } = useQuery<IsoReviewActionItem[]>({
    queryKey: ["/api/iso-management-reviews", review.id, "actions"],
    queryFn: () => fetch(`/api/iso-management-reviews/${review.id}/actions`).then(r => r.json()),
  });
  const { data: objectives = [] } = useQuery<IsoObjective[]>({
    queryKey: ["/api/iso-objectives", isoProjectId],
    queryFn: () => fetch(`/api/iso-objectives${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });
  const { data: allActuals = [] } = useQuery<IsoKpiActual[]>({
    queryKey: ["/api/iso-kpi-actuals", isoProjectId],
    queryFn: () => fetch(`/api/iso-kpi-actuals${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });

  const previousReview = [...allReviews]
    .filter(r => r.id !== review.id && new Date(r.meetingDate) < new Date(review.meetingDate))
    .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())[0];

  const { data: prevActions = [] } = useQuery<IsoReviewActionItem[]>({
    queryKey: ["/api/iso-management-reviews", previousReview?.id, "actions"],
    queryFn: () => previousReview ? fetch(`/api/iso-management-reviews/${previousReview.id}/actions`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!previousReview,
  });
  const openPrevActions = prevActions.filter(a => a.status === "open" || a.status === "in_progress");

  // ── PowerPoint export — placed here so all deps (actions, objectives, allActuals, openPrevActions) are defined ──
  const handleGeneratePptx = useCallback(async () => {
    setGeneratingPptx(true);
    try {
      const kpiResponsesMap = agenda.find(a => a.clause === kpiResponsesAnchorClause)?.kpiResponses ?? {};
      const pptxKpis = objectives.map(obj => {
        const acts = allActuals.filter(a => a.objectiveId === obj.id);
        const sorted = [...acts].sort((a, b) => a.period.localeCompare(b.period));
        const latest = sorted[sorted.length - 1];
        const targetVal = parseFloat(obj.target ?? "0");
        return {
          name: obj.name,
          processName: obj.processName,
          target: obj.target ?? "0",
          unit: obj.unit ?? "",
          status: obj.status,
          frequency: obj.frequency ?? "",
          latestVal: latest ? parseFloat(latest.actual) : null,
          latestPeriod: latest?.period ?? null,
          streak: offTrackStreakCount(acts, targetVal),
          explanation: kpiResponsesMap[String(obj.id)] ?? "",
          actuals: sorted.map(a => ({ period: a.period, actual: parseFloat(a.actual) })),
        };
      });

      await generateMgmtReviewPptx({
        title: review.title,
        meetingDate: String(review.meetingDate),
        attendees: review.attendees,
        standard: standardLabel,
        status: review.status,
        kpis: pptxKpis,
        flaggedKpis: pptxKpis.filter(k => k.streak >= trendThreshold),
        trendThreshold,
        agendaItems: agenda.map(a => ({ clause: a.clause, title: a.title, covered: a.covered, notes: a.notes })),
        actions: actions.map(a => ({ description: a.description, owner: a.owner, dueDate: a.dueDate ? String(a.dueDate) : null, status: a.status })),
        carryoverActions: openPrevActions.map(a => ({ description: a.description, owner: a.owner, dueDate: a.dueDate ? String(a.dueDate) : null, status: a.status })),
        previousReviewTitle: previousReview?.title,
      });

      toast({ title: "PowerPoint downloaded", description: "Your management review presentation is ready." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setGeneratingPptx(false);
    }
  }, [review, agenda, objectives, allActuals, actions, openPrevActions, trendThreshold, standardLabel, kpiResponsesAnchorClause, toast]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Omit<InsertIsoManagementReview, 'userId'>>) => apiRequest("PATCH", `/api/iso-management-reviews/${review.id}`, data).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", isoProjectId] }); toast({ title: "Review saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addActionMutation = useMutation({
    mutationFn: (data: Omit<InsertIsoReviewActionItem, 'userId' | 'reviewId'>) => apiRequest("POST", `/api/iso-management-reviews/${review.id}/actions`, data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] });
      toast({ title: "Action item added" });
      setShowActionForm(false);
      setActionForm({ description: "", owner: "", dueDate: "" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<InsertIsoReviewActionItem, 'userId' | 'reviewId'>> }) => apiRequest("PATCH", `/api/iso-review-action-items/${id}`, data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] }),
  });

  const deleteActionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-review-action-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] }),
  });

  const cycleActionStatus = (action: IsoReviewActionItem) => {
    const next = ACTION_STATUS_CYCLE[action.status] ?? "open";
    const patch: { status: string; closedAt?: string | null } = { status: next };
    if (next === "closed") patch.closedAt = new Date().toISOString();
    else patch.closedAt = null;
    updateActionMutation.mutate({ id: action.id, data: patch });
  };

  const saveAgenda = () => updateMutation.mutate({ agendaItems: agenda });
  const toggleCovered = (clause_: string) => {
    setAgenda(a => a.map(item => item.clause === clause_ ? { ...item, covered: !item.covered } : item));
  };

  const coveredCount = agenda.filter(a => a.covered).length;
  const getActuals = (objId: number) => allActuals.filter(a => a.objectiveId === objId);
  const flaggedObjectives = objectives.filter(obj => offTrackStreakCount(getActuals(obj.id), parseFloat(obj.target ?? "0")) >= trendThreshold);

  const inputItems = template.filter(i => i.group === "input");
  const outputItems = template.filter(i => i.group === "output");

  // Group inputs by section
  const inputSections = inputItems.reduce<Record<string, AgendaTemplateItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground">{review.title}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(review.meetingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {review.attendees && ` · ${review.attendees}`}
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-accent text-accent">{standardLabel}</Badge>
        <Badge variant={review.status === "complete" ? "default" : "outline"}>
          {review.status === "complete" ? "Complete" : "Draft"}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGeneratePptx}
          disabled={generatingPptx}
          className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
          data-testid="button-export-pptx"
        >
          {generatingPptx
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
            : <><Presentation className="w-3.5 h-3.5" /> Export .pptx</>}
        </Button>
        <Button size="sm" onClick={() => updateMutation.mutate({ status: review.status === "complete" ? "draft" : "complete" })} variant="outline">
          {review.status === "complete" ? "Reopen" : "Mark Complete"}
        </Button>
      </div>

      {/* Carryover open/in-progress actions from previous review */}
      {openPrevActions.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Carryover: {openPrevActions.length} Open / In-Progress Action{openPrevActions.length > 1 ? "s" : ""} from Previous Review
            </CardTitle>
            {previousReview && <p className="text-xs text-muted-foreground">From: {previousReview.title} · {new Date(previousReview.meetingDate).toLocaleDateString()}</p>}
          </CardHeader>
          <CardContent className="space-y-2">
            {openPrevActions.map(a => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{a.description}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">{a.status.replace("_", " ")}</Badge>
                  {a.owner && <span className="text-muted-foreground ml-2">Owner: {a.owner}</span>}
                  {a.dueDate && <span className="text-muted-foreground ml-2">Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Flagged KPIs — Negative Trend Alert */}
      <Card className={flaggedObjectives.length > 0 ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10" : "border-border"}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${flaggedObjectives.length > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}`}>
              <AlertTriangle className="w-4 h-4" />
              {flaggedObjectives.length > 0
                ? `${flaggedObjectives.length} KPI${flaggedObjectives.length > 1 ? "s" : ""} — Negative Trend Confirmed (${trendThreshold}+ consecutive periods)`
                : `No KPIs with confirmed negative trend (threshold: ${trendThreshold} consecutive periods)`}
            </CardTitle>
            {/* Threshold selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">CA trigger after</span>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => handleTrendThresholdChange(n)}
                  className={`w-6 h-6 text-xs rounded font-bold transition-colors ${trendThreshold === n ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                  title={`Set trend threshold to ${n} consecutive negative period${n > 1 ? "s" : ""}`}
                  data-testid={`button-trend-threshold-${n}`}
                >
                  {n}
                </button>
              ))}
              <span className="text-[10px] text-muted-foreground font-medium">period{trendThreshold > 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardHeader>
        {flaggedObjectives.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {flaggedObjectives.map(obj => (
                <Badge key={obj.id} variant="outline" className="text-xs border-red-400 text-red-700 dark:text-red-400">
                  {obj.name} {obj.processName ? `(${obj.processName})` : ""}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-2 font-medium">
              ⚠ Corrective actions are required for all flagged KPIs. Open each KPI in the agenda section below to document and initiate.
            </p>
          </CardContent>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          AGENDA CHECKLIST — FIRST: All required inputs per standard 9.3
          ══════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {standardLabel} {clause} Agenda Checklist
                <span className="ml-2 text-muted-foreground font-normal text-xs">{coveredCount}/{agenda.length} covered</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Check each item as it is reviewed during the meeting and add notes / status.</p>
            </div>
            <Button size="sm" onClick={saveAgenda} disabled={updateMutation.isPending} variant="outline" data-testid="button-save-agenda">
              Save Agenda
            </Button>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${agenda.length > 0 ? (coveredCount / agenda.length) * 100 : 0}%` }} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{clause} Required Inputs</div>

          {Object.entries(inputSections).map(([section, items]) => {
            const coveredInSection = items.filter(item => agenda.find(a => a.clause === item.clause)?.covered).length;
            const freq = items[0]?.frequency;
            return (
              <div key={section} className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">{section}</span>
                  <div className="flex items-center gap-2">
                    <FrequencyBadge frequency={freq} />
                    <span className={`text-[10px] font-medium ${coveredInSection === items.length ? "text-green-600" : "text-muted-foreground"}`}>
                      {coveredInSection}/{items.length}
                      {coveredInSection === items.length && " ✓"}
                    </span>
                  </div>
                </div>

                {/* Link to Measurement & Monitoring for sections about objectives/KPIs/monitoring */}
                {isLiveDataSection(section) && (
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-200/50 dark:border-blue-800/30 gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BarChart2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-[11px] text-blue-700 dark:text-blue-300">
                        Review live trend data, gauges &amp; actuals in the Measurement &amp; Monitoring module
                      </span>
                    </div>
                    {onGoToMeasurement && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-7 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 gap-1"
                        onClick={onGoToMeasurement}
                      >
                        <ExternalLink className="w-3 h-3" /> Open M&amp;M
                      </Button>
                    )}
                  </div>
                )}

                {/* KPI Attention Required strip — only for live data sections */}
                {isLiveDataSection(section) && objectives.length > 0 && (
                  <KpiAttentionStrip
                    objectives={objectives}
                    getActuals={getActuals}
                    agenda={agenda}
                    setAgenda={setAgenda}
                    onAddAction={prefillAction}
                    anchorClause={kpiResponsesAnchorClause}
                    trendThreshold={trendThreshold}
                  />
                )}

                <div className="divide-y divide-border/50">
                  {items.map(item => {
                    const agItem = agenda.find(a => a.clause === item.clause);
                    if (!agItem) return null;
                    const itemFreqDiffers = item.frequency && item.frequency !== freq;
                    return (
                      <div key={item.clause} className={`p-3 transition-colors ${agItem.covered ? "bg-green-50 dark:bg-green-900/20" : "bg-background"}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={agItem.covered}
                            onCheckedChange={() => toggleCovered(item.clause)}
                            data-testid={`checkbox-agenda-${item.clause}`}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono text-accent font-bold">{item.clause}</span>
                              <span className="text-sm text-foreground leading-snug">{item.title}</span>
                              {agItem.covered && <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                              {itemFreqDiffers && <FrequencyBadge frequency={item.frequency} />}
                              {(item.clause === "9.3.2(a)" || item.clause === "14.9.3(a)" || item.clause === "45.9.3(a)" || item.clause === "5.6.1-prev" || item.clause === "as.9.3.2(a)" || item.clause === "27.9.3(a)") && openPrevActions.length > 0 && (
                                <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-600">{openPrevActions.length} open from prev.</Badge>
                              )}
                            </div>
                            {agItem.covered && (
                              <Textarea
                                value={agItem.notes}
                                onChange={e => setAgenda(a => a.map(i => i.clause === item.clause ? { ...i, notes: e.target.value } : i))}
                                placeholder="Status, notes, reported by…"
                                data-testid={`textarea-agenda-notes-${item.clause}`}
                                className="mt-2 text-xs"
                                rows={2}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Required Outputs</div>
          <div className="rounded-lg border border-border overflow-hidden divide-y divide-border/50">
            {outputItems.map(item => {
              const agItem = agenda.find(a => a.clause === item.clause);
              if (!agItem) return null;
              return (
                <div key={item.clause} className={`p-3 transition-colors ${agItem.covered ? "bg-green-50 dark:bg-green-900/20" : "bg-background"}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={agItem.covered}
                      onCheckedChange={() => toggleCovered(item.clause)}
                      data-testid={`checkbox-agenda-${item.clause}`}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-accent font-bold">{item.clause}</span>
                        <span className="text-sm text-foreground leading-snug">{item.title}</span>
                        {agItem.covered && <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                      </div>
                      {agItem.covered && (
                        <Textarea
                          value={agItem.notes}
                          onChange={e => setAgenda(a => a.map(i => i.clause === item.clause ? { ...i, notes: e.target.value } : i))}
                          placeholder="Decisions made, actions assigned…"
                          data-testid={`textarea-agenda-notes-${item.clause}`}
                          className="mt-2 text-xs"
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          KPI PERFORMANCE DATA — Collapsible, comes AFTER the agenda
          ══════════════════════════════════════════════════════════════════════ */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setKpiExpanded(v => !v)}
            >
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-accent" />
                KPI Performance Data
                <span className="text-xs font-normal text-muted-foreground font-mono">
                  {objectives.filter(o => o.status === "on_track").length}/{objectives.length} on track
                </span>
              </CardTitle>
              <span className="text-muted-foreground ml-2">
                {kpiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            <p className="text-xs text-muted-foreground mt-1 pb-3">Snapshot of KPI data from the Measurement &amp; Monitoring module. Open that module for full trend charts and 12-month history.</p>
          </CardHeader>
          {kpiExpanded && (
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {objectives.map(obj => (
                  <KpiSparklineCard key={obj.id} obj={obj} actuals={getActuals(obj.id)} trendThreshold={trendThreshold} />
                ))}
              </div>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {["KPI", "Process", "Target", "Latest", "Period", "Variance", "Status"].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {objectives.map(obj => {
                      const acts = getActuals(obj.id);
                      const sorted = [...acts].sort((a, b) => b.period.localeCompare(a.period));
                      const latest = sorted[0];
                      const latestVal = latest ? parseFloat(latest.actual) : null;
                      const targetVal = parseFloat(obj.target ?? "0");
                      const variance = latestVal !== null ? latestVal - targetVal : null;
                      const variancePct = variance !== null && targetVal !== 0 ? (variance / targetVal * 100) : null;
                      const streak = offTrackStreakCount(acts, targetVal);
                      return (
                        <tr key={obj.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{obj.name}{streak >= trendThreshold && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" title={`${streak} consecutive negative periods`} />}</td>
                          <td className="px-3 py-2 text-muted-foreground">{obj.processName ?? "—"}</td>
                          <td className="px-3 py-2">{obj.target} {obj.unit}</td>
                          <td className="px-3 py-2 font-medium">{latestVal !== null ? `${latestVal} ${obj.unit}` : "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{latest?.period ?? "—"}</td>
                          <td className="px-3 py-2">
                            {variance !== null ? (
                              <span className={variance >= 0 ? "text-green-600" : "text-red-500"}>
                                {variance >= 0 ? "+" : ""}{variance.toFixed(1)}
                                {variancePct !== null && <span className="opacity-60 ml-1">({variancePct >= 0 ? "+" : ""}{variancePct.toFixed(0)}%)</span>}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${obj.status === "on_track" ? "bg-green-100 text-green-700" : obj.status === "at_risk" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {obj.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Meeting Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Meeting Notes / Conclusions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            defaultValue={review.overallNotes ?? ""}
            onBlur={e => updateMutation.mutate({ overallNotes: e.target.value })}
            placeholder="Overall conclusions, decisions made, QMS suitability determination…"
            data-testid="textarea-review-notes"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Register — 9.3.3 */}
      <Card ref={actionRegisterRef}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              Action Register
              <span className="text-xs font-normal text-muted-foreground font-mono">{clause.replace("", "")}3</span>
              {actions.filter(a => a.status !== "closed").length > 0 && (
                <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                  {actions.filter(a => a.status !== "closed").length} open
                </Badge>
              )}
            </CardTitle>
            <Button size="sm" onClick={() => setShowActionForm(true)} data-testid="button-add-action" className="bg-accent hover:bg-accent/90 text-white">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Action
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Click the status icon to cycle: Open → In Progress → Closed</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.length === 0 && !showActionForm && (
            <p className="text-sm text-muted-foreground text-center py-4">No action items yet. Add improvement actions and decisions from this review.</p>
          )}
          {showActionForm && (
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Action Description *</Label>
                  <Input value={actionForm.description} onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to be done" data-testid="input-action-desc" />
                </div>
                <div>
                  <Label>Owner</Label>
                  <Input value={actionForm.owner} onChange={e => setActionForm(f => ({ ...f, owner: e.target.value }))} placeholder="Responsible person" data-testid="input-action-owner" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={actionForm.dueDate} onChange={e => setActionForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-action-due" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowActionForm(false)}>Cancel</Button>
                <Button size="sm" onClick={() => addActionMutation.mutate(actionForm)} disabled={addActionMutation.isPending} data-testid="button-submit-action" className="bg-accent hover:bg-accent/90 text-white">Add</Button>
              </div>
            </div>
          )}
          {actions.map(action => (
            <div key={action.id} className={`flex items-start gap-3 p-3 rounded-lg border ${ACTION_STATUS_COLORS[action.status] ?? ACTION_STATUS_COLORS.open}`}>
              <button onClick={() => cycleActionStatus(action)} data-testid={`button-cycle-action-${action.id}`} title={`Status: ${action.status} — click to advance`} className="mt-0.5 shrink-0">
                {ACTION_STATUS_ICON[action.status as keyof typeof ACTION_STATUS_ICON] ?? ACTION_STATUS_ICON.open}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${action.status === "closed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{action.description}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {action.owner && <span>Owner: <span className="font-medium">{action.owner}</span></span>}
                  {action.dueDate && <span>Due: <span className="font-medium">{new Date(action.dueDate).toLocaleDateString()}</span></span>}
                  <Badge variant="outline" className={`text-xs ${action.status === "in_progress" ? "border-yellow-400 text-yellow-600" : action.status === "closed" ? "border-green-400 text-green-600" : ""}`}>
                    {action.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <button onClick={() => deleteActionMutation.mutate(action.id)} className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 shrink-0" data-testid={`button-delete-action-${action.id}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Module (List View)
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_REVIEW_FORM = { title: "Management Review", meetingDate: "", attendees: "", status: "draft" };

export default function ManagementReviewModule({ isoProjectId, standard, onGoToMeasurement }: { isoProjectId?: number; standard?: string | null; onGoToMeasurement?: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_REVIEW_FORM);
  const [selected, setSelected] = useState<IsoManagementReview | null>(null);
  const [isaOpen, setIsaOpen] = useState(false);
  const [isaInput, setIsaInput] = useState("");
  const [isaMessages, setIsaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isaLoading, setIsaLoading] = useState(false);

  const template = getAgendaTemplate(standard);
  const standardLabel = getStandardLabel(standard);
  const clause = getManagementClause(standard);
  const defaultFrequency = standard?.toUpperCase().includes("IATF") ? "monthly" : "quarterly";

  const reviewsQKey = ["/api/iso-management-reviews", isoProjectId];
  const actionsQKey = ["/api/iso-review-action-items", isoProjectId];

  const { data: reviews = [], isLoading } = useQuery<IsoManagementReview[]>({
    queryKey: reviewsQKey,
    queryFn: () => fetch(`/api/iso-management-reviews${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });
  const { data: allActionItems = [] } = useQuery<IsoReviewActionItem[]>({
    queryKey: actionsQKey,
    queryFn: () => fetch(`/api/iso-review-action-items${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });
  const { data: objectives = [] } = useQuery<IsoObjective[]>({
    queryKey: ["/api/iso-objectives", isoProjectId],
    queryFn: () => fetch(`/api/iso-objectives${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<InsertIsoManagementReview, 'userId'>) => apiRequest("POST", "/api/iso-management-reviews", data).then(r => r.json()),
    onSuccess: (newReview: IsoManagementReview) => {
      qc.invalidateQueries({ queryKey: reviewsQKey });
      toast({ title: "Review created" });
      setShowForm(false);
      setForm(EMPTY_REVIEW_FORM);
      setSelected(newReview);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-management-reviews/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: reviewsQKey }); toast({ title: "Review deleted" }); },
  });

  if (selected) {
    const latest = reviews.find(r => r.id === selected.id) ?? selected;
    return <ReviewDetail review={latest} allReviews={reviews} onBack={() => setSelected(null)} isoProjectId={isoProjectId} standard={standard} onGoToMeasurement={onGoToMeasurement} />;
  }

  const sendIsaMessage = async () => {
    if (!isaInput.trim()) return;
    const userMsg = { role: "user" as const, content: isaInput.trim() };
    const newMsgs = [...isaMessages, userMsg];
    setIsaMessages(newMsgs);
    setIsaInput("");
    setIsaLoading(true);
    try {
      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          systemPrompt: `You are Isa, Lead ISO Auditor for ACSI ISO Manager. You specialize in ${standardLabel} ${clause} Management Review. Help organizations conduct effective management reviews that meet ISO requirements, covering all required inputs and expected outputs.${standard?.toUpperCase().includes("IATF") ? " For IATF 16949, emphasize monthly frequency requirements (9.3.2.1), FMEA review, LPA audit results, COPQ, scrap cost, on-time PPAP, and manufacturing-specific KPIs." : ""}${standard?.toUpperCase().includes("13485") ? " For ISO 13485, emphasize 5.6 inputs including customer feedback, MDR/vigilance reporting, regulatory authority communications, and CAPA status." : ""}${standard?.toUpperCase().includes("45001") ? " For ISO 45001, emphasize incident trends, leading/lagging safety indicators, legal compliance evaluation, and worker consultation/participation." : ""}${standard?.toUpperCase().includes("14001") ? " For ISO 14001, emphasize significant environmental aspects, compliance obligations, environmental performance data, and stakeholder communications." : ""}${standard?.toUpperCase().includes("27001") ? " For ISO 27001, emphasize risk assessment results, risk treatment plan status, security incident trends, and Statement of Applicability review." : ""} Provide practical, clause-referenced guidance.`,
        }),
      });
      const data = await resp.json();
      setIsaMessages([...newMsgs, { role: "assistant", content: data.content || "Sorry, I'm unavailable right now." }]);
    } catch {
      setIsaMessages([...newMsgs, { role: "assistant", content: "Sorry, I'm unavailable right now." }]);
    } finally { setIsaLoading(false); }
  };

  const complete = reviews.filter(r => r.status === "complete").length;
  const draft = reviews.filter(r => r.status === "draft").length;
  const onTrackCount = objectives.filter(o => o.status === "on_track").length;
  const totalObjectives = objectives.length;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            Management Review
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {standardLabel} {clause} — Top management reviews the management system at planned intervals
            <span className="ml-2 text-accent font-medium capitalize">({defaultFrequency})</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsaOpen(true)} data-testid="button-isa-review" className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
            <Bot className="w-4 h-4 mr-1" /> Ask Isa
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} data-testid="button-new-review" className="bg-accent hover:bg-accent/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> New Review
          </Button>
        </div>
      </div>

      {/* Standard info strip */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <Badge variant="outline" className="text-xs border-accent text-accent">{standardLabel}</Badge>
        <span>{template.filter(i => i.group === "input").length} required inputs · {template.filter(i => i.group === "output").length} required outputs · {template.length} total agenda items</span>
        {standard?.toUpperCase().includes("IATF") && <Badge variant="outline" className="text-xs border-blue-400 text-blue-600">Monthly frequency — IATF 9.3.2.1</Badge>}
        {standard?.toUpperCase().includes("13485") && <Badge variant="outline" className="text-xs border-purple-400 text-purple-600">5.6 — Medical Device QMS</Badge>}
      </div>

      {/* KPI summary */}
      {totalObjectives > 0 && (
        <Card className={`border-l-4 ${onTrackCount === totalObjectives ? "border-green-400 bg-green-50 dark:bg-green-900/10" : onTrackCount >= totalObjectives * 0.7 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10" : "border-red-400 bg-red-50 dark:bg-red-900/10"}`}>
          <CardContent className="p-4">
            <p className="text-base font-bold text-foreground" data-testid="text-kpi-summary">
              {onTrackCount} of {totalObjectives} objectives on track as of {today}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {objectives.filter(o => o.status === "at_risk").length > 0 && `${objectives.filter(o => o.status === "at_risk").length} at risk · `}
              {objectives.filter(o => o.status === "off_track").length > 0 && `${objectives.filter(o => o.status === "off_track").length} off track · `}
              See KPI Measurement module for details
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{reviews.length}</div><div className="text-xs text-muted-foreground mt-1">Total Reviews</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{complete}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complete</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{draft}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Draft</div></CardContent></Card>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No management reviews recorded</p>
            <p className="text-xs mt-1">{standardLabel} {clause} requires top management to review the management system at planned intervals ({defaultFrequency}). Start by creating your first review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...reviews].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()).map(r => {
            const agendaItems = (r.agendaItems as AgendaItem[] | null) ?? [];
            const covered = agendaItems.filter(a => a.covered).length;
            const total = template.length;
            const reviewActions = allActionItems.filter(a => a.reviewId === r.id);
            const openTotal = reviewActions.filter(a => a.status !== "closed").length;
            return (
              <Card key={r.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelected(r)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{r.title}</span>
                        <Badge variant={r.status === "complete" ? "default" : "outline"} className="text-xs">
                          {r.status === "complete" ? "Complete" : "Draft"}
                        </Badge>
                        {openTotal > 0 && <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">{openTotal} action{openTotal > 1 ? "s" : ""} open</Badge>}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.meetingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                        {r.attendees && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.attendees.split(",").filter(Boolean).length} attendee{r.attendees.split(",").filter(Boolean).length !== 1 ? "s" : ""}</span>}
                        <span>Agenda: {covered}/{total} covered ({total > 0 ? Math.round((covered / total) * 100) : 0}%)</span>
                      </div>
                      {covered > 0 && (
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden w-32">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${(covered / total) * 100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(r.id); }} className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Review Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Management Review</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">Template: <span className="font-medium text-accent">{standardLabel}</span> · {template.length} agenda items pre-loaded ({template.filter(i => i.group === "input").length} inputs + {template.filter(i => i.group === "output").length} outputs)</p>
          <div className="space-y-4 py-2">
            <div>
              <Label>Review Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Q2 2025 Management Review" data-testid="input-review-title" />
            </div>
            <div>
              <Label>Meeting Date *</Label>
              <Input type="date" value={form.meetingDate} onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))} data-testid="input-review-date" />
            </div>
            <div>
              <Label>Attendees</Label>
              <Input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="e.g. Top Management, Quality Manager, Department Heads" data-testid="input-review-attendees" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ ...form, isoProjectId })} disabled={createMutation.isPending || !form.title.trim() || !form.meetingDate} data-testid="button-submit-review" className="bg-accent hover:bg-accent/90 text-white">
                Create Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Isa Panel */}
      <Dialog open={isaOpen} onOpenChange={setIsaOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <Bot className="w-5 h-5" /> Isa — Management Review Advisor ({standardLabel} {clause})
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isaMessages.length === 0 && (
              <div className="text-sm text-muted-foreground bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                <p className="font-medium text-violet-800 dark:text-violet-300 mb-2">Ask me about {standardLabel} {clause} Management Review:</p>
                <ul className="space-y-1 text-xs">
                  <li>• What are all the required inputs for a management review?</li>
                  <li>• What outputs must be documented and retained as records?</li>
                  {standard?.toUpperCase().includes("IATF") && <><li>• What does IATF 16949 9.3.2.1 require beyond ISO 9001?</li><li>• How should LPA and FMEA results be presented?</li></>}
                  {standard?.toUpperCase().includes("13485") && <><li>• What regulatory reporting must be reviewed in 5.6?</li><li>• How should complaint and MDR data be presented?</li></>}
                  {standard?.toUpperCase().includes("45001") && <><li>• How should incident data and TRIR be presented?</li><li>• What worker consultation evidence is needed?</li></>}
                  {standard?.toUpperCase().includes("27001") && <><li>• How should the risk treatment plan status be reviewed?</li><li>• What security metrics should be included?</li></>}
                  {!standard || (!standard.toUpperCase().includes("IATF") && !standard.toUpperCase().includes("13485") && !standard.toUpperCase().includes("45001") && !standard.toUpperCase().includes("27001")) && <><li>• How often should management reviews be conducted?</li><li>• What do auditors look for during management review audits?</li></>}
                </ul>
              </div>
            )}
            {isaMessages.map((m, i) => (
              <div key={i} className={`text-sm rounded-lg p-3 ${m.role === "user" ? "bg-muted ml-8" : "bg-violet-50 dark:bg-violet-900/20 mr-8"}`}>
                <div className="font-medium text-xs mb-1 text-muted-foreground">{m.role === "user" ? "You" : "Isa"}</div>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {isaLoading && <div className="text-xs text-violet-600 animate-pulse">Isa is thinking…</div>}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input value={isaInput} onChange={e => setIsaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendIsaMessage()} placeholder={`Ask Isa about ${standardLabel} management review…`} data-testid="input-isa-review" className="flex-1" />
            <Button onClick={sendIsaMessage} disabled={isaLoading} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
