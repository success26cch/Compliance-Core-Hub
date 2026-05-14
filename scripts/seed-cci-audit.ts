/**
 * Seed CCI Chemical's Internal Audit Module
 * - Fixes audit id=2 status: "scheduled" → "planned"
 * - Seeds audit_process_schedule for all 14 CCI IATF processes
 * - Seeds iso_audit_process_notes for completed audit (id=1)
 * Run: npx tsx scripts/seed-cci-audit.ts
 */

import { db } from "../server/db";
import { isoAudits, auditProcessSchedule, isoAuditProcessNotes } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const USER_ID = "54320068";
const ISO_PROJECT_ID = 4;
const COMPLETED_AUDIT_ID = 1;

// ── Fix invalid status ────────────────────────────────────────────────────────
async function fixAuditStatus() {
  console.log("[1] Fixing audit id=2 status: scheduled → planned...");
  await db.update(isoAudits)
    .set({ status: "planned" })
    .where(and(eq(isoAudits.id, 2), eq(isoAudits.userId, USER_ID)));
  console.log("    ✓ Fixed");
}

// ── Seed Audit Schedule ───────────────────────────────────────────────────────
const SCHEDULE_DATA = [
  // COP processes — higher risk
  {
    processName: "Sales & Customer Relations",
    processType: "COP",
    riskComplexity: 5, riskCustomerImpact: 8, riskPreviousAudit: 2,
    riskPerformance: 5, riskChangeFreq: 3, riskComplaints: 5,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-02-17"),
    auditorAssigned: "Maria Santos",
    notes: "Customer satisfaction trending at 94% — monitor RFQ response times",
  },
  {
    processName: "APQP / New Program Launch",
    processType: "COP",
    riskComplexity: 9, riskCustomerImpact: 10, riskPreviousAudit: 7,
    riskPerformance: 8, riskChangeFreq: 7, riskComplaints: 5,
    recommendedFrequency: "urgent",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2026-09-08"),
    auditorAssigned: "David Kwan",
    notes: "2 new programs launched this year — PPAP timing failures in Q3",
  },
  {
    processName: "Chemical Blending",
    processType: "COP",
    riskComplexity: 9, riskCustomerImpact: 9, riskPreviousAudit: 8,
    riskPerformance: 7, riskChangeFreq: 5, riskComplaints: 8,
    recommendedFrequency: "urgent",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2026-09-08"),
    auditorAssigned: "David Kwan",
    notes: "Core production process — 2 NCs in Feb audit (8.5.1, 8.7)",
  },
  {
    processName: "Analytical Testing",
    processType: "COP",
    riskComplexity: 7, riskCustomerImpact: 8, riskPreviousAudit: 2,
    riskPerformance: 5, riskChangeFreq: 3, riskComplaints: 2,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-02-17"),
    auditorAssigned: "Maria Santos",
    notes: "Lab controls and test method validation up to date",
  },
  {
    processName: "Filling & Packaging",
    processType: "COP",
    riskComplexity: 6, riskCustomerImpact: 8, riskPreviousAudit: 2,
    riskPerformance: 5, riskChangeFreq: 4, riskComplaints: 3,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-02-17"),
    auditorAssigned: "Maria Santos",
    notes: "Label change in Q2 — verify error-proofing for new label applicator",
  },
  {
    processName: "Warehouse & Shipping",
    processType: "COP",
    riskComplexity: 5, riskCustomerImpact: 7, riskPreviousAudit: 2,
    riskPerformance: 5, riskChangeFreq: 3, riskComplaints: 3,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-08-17"),
    auditorAssigned: "Maria Santos",
    notes: "FIFO verification required; OTD at 97% last quarter",
  },
  {
    processName: "Product Design and Development",
    processType: "COP",
    riskComplexity: 8, riskCustomerImpact: 9, riskPreviousAudit: 5,
    riskPerformance: 6, riskChangeFreq: 7, riskComplaints: 4,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-02-17"),
    auditorAssigned: "David Kwan",
    notes: "Design FMEA review required — 8.3.3 NC from Feb audit under CAPA",
  },
  // SOP processes
  {
    processName: "Supplier Management & Purchasing",
    processType: "SOP",
    riskComplexity: 6, riskCustomerImpact: 7, riskPreviousAudit: 2,
    riskPerformance: 5, riskChangeFreq: 4, riskComplaints: 2,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-08-17"),
    auditorAssigned: "Maria Santos",
    notes: "Approved Supplier List reviewed — 3 new raw material suppliers added",
  },
  {
    processName: "HR, Training & Competency",
    processType: "SOP",
    riskComplexity: 3, riskCustomerImpact: 4, riskPreviousAudit: 2,
    riskPerformance: 3, riskChangeFreq: 3, riskComplaints: 2,
    recommendedFrequency: "triennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2029-02-17"),
    auditorAssigned: "Maria Santos",
    notes: "Training matrix fully current; new hire onboarding well documented",
  },
  {
    processName: "Equipment Maintenance & Calibration",
    processType: "SOP",
    riskComplexity: 7, riskCustomerImpact: 6, riskPreviousAudit: 5,
    riskPerformance: 6, riskChangeFreq: 4, riskComplaints: 2,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-02-17"),
    auditorAssigned: "David Kwan",
    notes: "OFI from Feb audit: PM completion rate below 85% target",
  },
  {
    processName: "Document & Records Control",
    processType: "SOP",
    riskComplexity: 3, riskCustomerImpact: 4, riskPreviousAudit: 2,
    riskPerformance: 3, riskChangeFreq: 3, riskComplaints: 2,
    recommendedFrequency: "triennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2029-02-17"),
    auditorAssigned: "Maria Santos",
    notes: "DCC system fully implemented — revision history well maintained",
  },
  // MOP processes
  {
    processName: "Management & Strategic Planning",
    processType: "MOP",
    riskComplexity: 4, riskCustomerImpact: 6, riskPreviousAudit: 2,
    riskPerformance: 4, riskChangeFreq: 3, riskComplaints: 2,
    recommendedFrequency: "triennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2029-02-17"),
    auditorAssigned: "David Kwan",
    notes: "Quality policy and objectives reviewed — strategic plan aligned",
  },
  {
    processName: "Internal Audit & Management Review",
    processType: "MOP",
    riskComplexity: 3, riskCustomerImpact: 3, riskPreviousAudit: 2,
    riskPerformance: 3, riskChangeFreq: 2, riskComplaints: 2,
    recommendedFrequency: "triennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2029-02-17"),
    auditorAssigned: "Maria Santos",
    notes: "Audit program completed on schedule; management review conducted Jan 2026",
  },
  {
    processName: "Corrective Action",
    processType: "MOP",
    riskComplexity: 5, riskCustomerImpact: 6, riskPreviousAudit: 5,
    riskPerformance: 5, riskChangeFreq: 3, riskComplaints: 5,
    recommendedFrequency: "biennial",
    consultantAudit: false,
    lastAuditDate: new Date("2026-02-17"),
    nextAuditDate: new Date("2027-08-17"),
    auditorAssigned: "David Kwan",
    notes: "2 open CARs from Feb audit — effectiveness verification due Q3",
  },
];

async function seedSchedule() {
  console.log("[2] Seeding audit_process_schedule (14 processes)...");
  await db.delete(auditProcessSchedule).where(eq(auditProcessSchedule.userId, USER_ID));
  for (const entry of SCHEDULE_DATA) {
    await db.insert(auditProcessSchedule).values({
      userId: USER_ID,
      isoProjectId: ISO_PROJECT_ID,
      ...entry,
    } as any);
  }
  console.log(`    ✓ Seeded ${SCHEDULE_DATA.length} schedule entries`);
}

// ── Seed Process Notes for completed audit ────────────────────────────────────
const PROCESS_NOTES = [
  {
    processName: "Chemical Blending",
    processObjectives: "Produce chemical blends conforming to customer specifications with defect rate ≤ 0.5% and on-time production completion ≥ 98%.",
    isObjectiveMet: "partial",
    objectiveMetNotes: "Defect rate met at 0.3%, however on-time production at 95.8% — below 98% target due to equipment downtime on Reactor Chiller (CAR-2025-012 open).",
    processInputs: "Customer formulation specifications, raw material certificates of analysis, production schedule, approved Bill of Materials",
    processOutputs: "Finished chemical blends, batch records, in-process test results, hold tags for non-conforming batches",
    processInteractions: "Receives orders from Sales & Customer Relations; feeds into Analytical Testing (QC release) and Filling & Packaging. Equipment needs coordinated with Maintenance.",
    personnelInterviewed: "J. Ramirez — Lead Blending Operator; K. Patel — QC Lab Manager; T. Wu — Production Supervisor",
    processDescription: "Blending operations are conducted in ISO Class 8 climate-controlled environment. Operators follow SOP-BL-001 Rev 6 and documented batch records. In-process sampling performed per sampling plan QCP-12. Batch records reviewed — 28 of 30 sampled records complete. 2 records missing final supervisor sign-off.",
    objectiveEvidence: "SOP-BL-001 Rev 6 verified current\nBatch records sampled — Feb 1–17, 2026 (30 batches)\nIn-process test results QCP-12 log reviewed\nOperator training records for 5 blending operators verified current\nChemical inventory / CoA files spot-checked (15 raw materials)\nEquipment calibration tags verified on all blending vessels",
    nonconformances: "NC-1 [8.5.1]: 2 of 30 batch records missing final production supervisor sign-off — not detected prior to release. (CAR-2026-003 issued)\nNC-2 [8.7]: Non-conforming batch #BL-2026-0047 (viscosity out of spec) was not properly quarantined — found in staging area without hold tag. (CAR-2026-004 issued)",
    opportunities: "Consider digital batch record system to eliminate missed signatures and enable real-time supervisor review\nReal-time viscosity monitoring sensors on blending vessels could enable immediate corrective action before batch release",
  },
  {
    processName: "Analytical Testing",
    processObjectives: "Release all finished products within 24 hours of production completion; maintain zero test method deviations without documented justification.",
    isObjectiveMet: "yes",
    objectiveMetNotes: "All 30 batches sampled were released within 18 hours average. No undocumented test method deviations found.",
    processInputs: "Finished blend samples (from Chemical Blending), approved test methods, calibrated analytical instruments, reagent stocks",
    processOutputs: "Certificate of Analysis, hold/release decisions, non-conformance reports for out-of-spec results",
    processInteractions: "Receives samples from Chemical Blending; releases product to Filling & Packaging; issues NCs to Corrective Action process.",
    personnelInterviewed: "K. Patel — QC Lab Manager; L. Chen — Senior Analyst; B. Okafor — Lab Technician",
    processDescription: "QC Lab operates per ISO 17025-aligned procedures. All instruments calibrated and within due dates. Test methods validated per SOPs. LIMS system used for result entry — results reviewed by Lab Manager before release.",
    objectiveEvidence: "QSP-LAB-003 Rev 4 (lab procedures) verified current\nCalibration records for all 6 analytical instruments — all current\nLIMS result logs for Feb 1–17, 2026 reviewed\nReagent inventory and expiry log verified\nAnalyst training and qualification records reviewed (3 analysts)",
    nonconformances: "",
    opportunities: "LIMS system could be integrated with ERP to trigger automatic production release notifications, eliminating email-based communication delays",
  },
  {
    processName: "APQP / New Program Launch",
    processObjectives: "Complete PPAP submissions on time with zero customer-rejected PPAPs. All APQP gate reviews completed per project schedule.",
    isObjectiveMet: "no",
    objectiveMetNotes: "2 of 3 active PPAP submissions were submitted late (FM-2026-01: 6 days late, GM-2026-03: 12 days late). Root cause: Design FMEA completion delays. Both PPAPs approved by customers after resubmission.",
    processInputs: "Customer purchase orders / SOWs, formulation R&D results, process capability data, customer-specific requirements",
    processOutputs: "APQP gate review records, PPAP submission packages, approved Production Part Approval, Control Plans",
    processInteractions: "Drives Chemical Blending (process development), Analytical Testing (capability studies), Document Control (PPAP documentation). Customer feedback feeds back from Sales.",
    personnelInterviewed: "R. Gomez — Program Manager; D. Kwan — Quality Manager; S. Kim — R&D Lead",
    processDescription: "APQP managed via project tracking spreadsheet. 3 active programs reviewed. Gate reviews documented. Design FMEA found to be initiated late on 2 programs — templates exist but assignment timing not formally controlled. Control Plans in place and current for all 3 programs.",
    objectiveEvidence: "APQP project tracker (3 active programs) reviewed\nPPAP submission packages for FM-2026-01 and GM-2026-03 reviewed\nDesign FMEA revision logs reviewed\nControl Plans CP-2026-01, CP-2026-02, CP-2026-03 verified\nCustomer approval letters on file",
    nonconformances: "NC-1 [8.3.3]: No documented procedure or timing matrix for Design FMEA initiation in the APQP process — timing left to Program Manager discretion, resulting in 2 late PPAPs. (CAR-2026-005 issued)",
    opportunities: "Implement formal APQP timeline template with DFMEA start gate tied to program kick-off meeting date\nConsider APQP project management software to automate gate review notifications and milestone tracking",
  },
  {
    processName: "Equipment Maintenance & Calibration",
    processObjectives: "Maintain PM completion rate ≥ 85% on-time. Zero overdue calibrations on production-critical instruments.",
    isObjectiveMet: "partial",
    objectiveMetNotes: "PM completion rate at 82% — 3% below 85% target (Reactor Chiller and Dosing Pump overdue). Calibration: 2 instruments overdue at time of audit (Viscometer, Conductivity Meter) — both since corrected.",
    processInputs: "PM schedule, calibration schedule, maintenance work orders, spare parts inventory, equipment manuals",
    processOutputs: "Completed PM records, calibration certificates, equipment status tags, work orders, downtime reports",
    processInteractions: "Supports all COP processes (production equipment); interfaces with Document Control (procedure updates); OOT calibration events trigger Corrective Action.",
    personnelInterviewed: "M. Torres — Maintenance Supervisor; J. Adeyemi — Calibration Technician; T. Wu — Production Supervisor",
    processDescription: "PM program managed via CCHUB system — 15 equipment items in register. PM frequencies assigned per IATF 8.5.1.1. Calibration register maintained for 15 gages. External calibration lab (AccuCal Labs, ISO 17025 accredited) used for precision instruments. Viscometer OOT assessment completed — impact assessed as low.",
    objectiveEvidence: "PM schedule and completion records Feb 2026 reviewed\nCalibration register — all 15 gages reviewed\nExternal calibration certificates from AccuCal Labs verified\nViscometer OOT risk assessment (CAR-2023-017) reviewed\nSpareParts inventory for Reactor Chiller and Dosing Pump verified",
    nonconformances: "",
    opportunities: "Establish automated PM reminder alerts for upcoming due dates (≤14 days) to prevent repeat overdue situations\nConsider adding Reactor Chiller to monthly predictive maintenance monitoring given its KPE status and recent downtime history",
  },
  {
    processName: "Corrective Action",
    processObjectives: "Close all CARs within defined response timelines: containment within 24h, root cause within 10 days, full CAPA within 30 days.",
    isObjectiveMet: "yes",
    objectiveMetNotes: "All 7 open CARs reviewed — containment and root cause actions completed within timelines. 2 CARs (CAR-2025-011, CAR-2025-012) extended beyond 30-day CAPA deadline with documented justification and management approval.",
    processInputs: "Nonconformance reports, customer complaints, internal audit findings, OOT calibration events, supplier quality issues",
    processOutputs: "Completed CAR records, effectiveness verification records, updated control plans / procedures, lessons-learned documentation",
    processInteractions: "Receives inputs from all processes. Outputs feed back into affected processes. Management Review receives CAPA status summary.",
    personnelInterviewed: "D. Kwan — Quality Manager; R. Gomez — Program Manager; M. Torres — Maintenance Supervisor",
    processDescription: "CAPA process managed per QSP-CA-001 Rev 3. CAR database reviewed — 7 open CARs, 12 closed in last 6 months. Effectiveness verification performed on 10 of 12 closed CARs. 8-D methodology used for all major NCs. Lessons learned documented and shared in monthly quality meeting.",
    objectiveEvidence: "CAR database — all open and recently closed CARs reviewed\nQSP-CA-001 Rev 3 verified current\n8-D records for 5 major CARs reviewed\nEffectiveness verification records for 10 closed CARs reviewed\nManagement review agenda — CAPA status included",
    nonconformances: "",
    opportunities: "Link CAPA system to customer complaint database to automate CAR creation for customer-reported issues\nDevelop a lessons-learned database searchable by process / clause to prevent repeat issues across programs",
  },
];

async function seedProcessNotes() {
  console.log("[3] Seeding iso_audit_process_notes for completed audit...");
  await db.delete(isoAuditProcessNotes).where(eq(isoAuditProcessNotes.auditId, COMPLETED_AUDIT_ID));
  for (const note of PROCESS_NOTES) {
    await db.insert(isoAuditProcessNotes).values({
      auditId: COMPLETED_AUDIT_ID,
      userId: USER_ID,
      ...note,
    });
  }
  console.log(`    ✓ Seeded ${PROCESS_NOTES.length} process notes for audit ${COMPLETED_AUDIT_ID}`);
}

// ── Update completed audit header fields ──────────────────────────────────────
async function updateAuditHeaders() {
  console.log("[4] Updating completed audit header fields...");
  await db.update(isoAudits).set({
    contact: "Tom Wu, Production Supervisor / David Kwan, Quality Manager",
    objective: "Verify conformance to IATF 16949:2016 requirements across all QMS processes, assess process effectiveness relative to quality objectives, and identify opportunities for continual improvement prior to Stage 2 surveillance audit.",
    exclusions: "Clause 8.3 Design & Development — CCI Chemical does not perform product design (customer-responsible)",
    openingMeetingDate: new Date("2026-02-17T08:00:00"),
    openingMeetingAttendees: "David Kwan (Lead Auditor), Maria Santos (Auditor), Tom Wu (Production Supervisor), Kevin Patel (QC Manager), Rosa Gomez (Program Manager), Mike Torres (Maintenance Supervisor)",
    closingMeetingDate: new Date("2026-02-17T16:30:00"),
    closingMeetingAttendees: "David Kwan (Lead Auditor), Maria Santos (Auditor), Tom Wu (Production Supervisor), Kevin Patel (QC Manager), Rosa Gomez (Program Manager), General Manager",
    executiveSummary: "The February 2026 internal audit of CCI Chemical's IATF 16949:2016 QMS found the management system to be substantially conforming, with two major nonconformances identified in the Chemical Blending and APQP processes.\n\nTwo major NCs were issued: (1) incomplete batch record sign-off controls in Chemical Blending (8.5.1), and (2) absence of a formalized DFMEA timing matrix in the APQP process (8.3.3). Both CARs have been opened and root causes identified.\n\nProcess effectiveness was rated as follows: Analytical Testing and Corrective Action processes are performing at target. Chemical Blending and APQP require attention. Equipment Maintenance is below target on PM completion rate.\n\nThe QMS demonstrates strong foundational controls in document management, calibration, and corrective action response. Recommended focus areas for the next 12 months: PPAP on-time performance, PM completion rate improvement, and batch record digital transformation.",
  }).where(and(eq(isoAudits.id, COMPLETED_AUDIT_ID), eq(isoAudits.userId, USER_ID)));
  console.log("    ✓ Updated completed audit header");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== CCI Chemical Audit Module Seed ===");
  await fixAuditStatus();
  await seedSchedule();
  await seedProcessNotes();
  await updateAuditHeaders();
  console.log("\n✅ Seed complete.");
  process.exit(0);
}

main().catch(err => { console.error("Seed error:", err); process.exit(1); });
