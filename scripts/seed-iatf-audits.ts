/**
 * Seed script: CCI Chemical IATF §9.2.2.3 Product Audits,
 *              §9.2.2.4 Manufacturing Process Audits, and
 *              IATF Audit Schedule entries.
 * Run: npx tsx scripts/seed-iatf-audits.ts
 */
import { db } from "../server/db";
import { iatfProductAudits, iatfMfgProcessAudits, iatfAuditSchedule } from "../shared/schema";
import { eq } from "drizzle-orm";

const USER_ID = "54320068";

// ── §9.2.2.3 Product Audit checklist (19 items) ──────────────────────────────
function makeProductChecklist(overrides: Record<string, { result: "pass" | "fail" | "na"; note?: string }> = []) {
  const items = [
    // Product ID / Traceability
    { id: "pid-1", category: "Product ID / Traceability",  question: "Product part number matches work order and traveler" },
    { id: "pid-2", category: "Product ID / Traceability",  question: "Revision level is current and matches control plan" },
    { id: "pid-3", category: "Product ID / Traceability",  question: "Lot/batch traceability records are complete and accessible" },
    // Dimensional / Physical
    { id: "dim-1", category: "Dimensional / Physical",     question: "Key dimensions are within specified tolerances" },
    { id: "dim-2", category: "Dimensional / Physical",     question: "Product weight / volume meets specification" },
    { id: "dim-3", category: "Dimensional / Physical",     question: "Surface finish meets drawing / spec requirements" },
    // Visual / Cosmetic
    { id: "vis-1", category: "Visual / Cosmetic",          question: "No visible contamination, discoloration, or foreign matter" },
    { id: "vis-2", category: "Visual / Cosmetic",          question: "No cracks, chips, voids, or surface defects" },
    // Functional / Performance
    { id: "fnc-1", category: "Functional / Performance",   question: "pH within specified range (where applicable)" },
    { id: "fnc-2", category: "Functional / Performance",   question: "Viscosity / consistency within specified range" },
    { id: "fnc-3", category: "Functional / Performance",   question: "Chemical composition meets specification (COA reviewed)" },
    // Labeling & Marking
    { id: "lbl-1", category: "Labeling & Marking",         question: "Label content is correct (part #, lot, rev, date)" },
    { id: "lbl-2", category: "Labeling & Marking",         question: "Regulatory / GHS / SDS information present where required" },
    { id: "lbl-3", category: "Labeling & Marking",         question: "Label is legible and securely affixed" },
    // Packaging & Preservation
    { id: "pkg-1", category: "Packaging & Preservation",   question: "Packaging material meets customer and specification requirements" },
    { id: "pkg-2", category: "Packaging & Preservation",   question: "Quantity per container is correct" },
    { id: "pkg-3", category: "Packaging & Preservation",   question: "No damage to containers; seals are intact" },
    // Documentation & Records
    { id: "doc-1", category: "Documentation & Records",    question: "Certificate of Analysis (COA) completed and attached" },
    { id: "doc-2", category: "Documentation & Records",    question: "Inspection / release sign-off completed by authorized QC" },
  ];

  return items.map(item => ({
    id: item.id,
    category: item.category,
    question: item.question,
    result: (overrides as any)[item.id]?.result ?? "pass",
    note: (overrides as any)[item.id]?.note ?? "",
  }));
}

// ── §9.2.2.4 Process Audit checklist (25 items) ──────────────────────────────
function makeProcessChecklist(overrides: Record<string, { result: "yes" | "no" | "partial" | "na"; note?: string }> = []) {
  const items = [
    // Setup & Authorization
    { id: "su-1", category: "Setup & Authorization",       question: "Production setup has been approved by authorized personnel" },
    { id: "su-2", category: "Setup & Authorization",       question: "Last-off sample approved and retained from prior run" },
    { id: "su-3", category: "Setup & Authorization",       question: "Work order / traveler is present and matches scheduled job" },
    // Process Parameters
    { id: "pp-1", category: "Process Parameters",          question: "All key process parameters are set per the control plan" },
    { id: "pp-2", category: "Process Parameters",          question: "Temperature / pressure / speed settings verified at startup" },
    { id: "pp-3", category: "Process Parameters",          question: "Process parameters are documented for this shift" },
    // Control Plan Conformance
    { id: "cp-1", category: "Control Plan Conformance",    question: "Control plan revision is current and at the workstation" },
    { id: "cp-2", category: "Control Plan Conformance",    question: "All control plan checks are being performed at required frequency" },
    { id: "cp-3", category: "Control Plan Conformance",    question: "In-process inspection data is recorded accurately" },
    { id: "cp-4", category: "Control Plan Conformance",    question: "Reaction plan is known and available for out-of-control conditions" },
    // Operator Qualification
    { id: "op-1", category: "Operator Qualification",      question: "Operator is trained and certified for this process" },
    { id: "op-2", category: "Operator Qualification",      question: "Training records are current and accessible" },
    // Work Instructions
    { id: "wi-1", category: "Work Instructions",           question: "Current work instructions are posted / accessible at the workstation" },
    { id: "wi-2", category: "Work Instructions",           question: "Operator can demonstrate understanding of critical steps" },
    { id: "wi-3", category: "Work Instructions",           question: "Engineering change notifications are incorporated in current WI" },
    // Monitoring & Measurement
    { id: "mm-1", category: "Monitoring & Measurement",    question: "Measuring devices are within calibration due date" },
    { id: "mm-2", category: "Monitoring & Measurement",    question: "Gauges are clean, undamaged, and stored correctly" },
    { id: "mm-3", category: "Monitoring & Measurement",    question: "SPC charts / data collection is being maintained (if applicable)" },
    // Nonconforming Product Control
    { id: "nc-1", category: "Nonconforming Product Control", question: "Nonconforming material area is clearly identified and segregated" },
    { id: "nc-2", category: "Nonconforming Product Control", question: "Nonconforming tags / labels are in use" },
    { id: "nc-3", category: "Nonconforming Product Control", question: "Nonconforming parts have been dispositioned (not left in queue)" },
    // Equipment & Tooling
    { id: "eq-1", category: "Equipment & Tooling",         question: "Equipment is in good working order (no unreported damage/wear)" },
    { id: "eq-2", category: "Equipment & Tooling",         question: "Tooling / dies / molds are correct revision and within service life" },
    { id: "eq-3", category: "Equipment & Tooling",         question: "Preventive maintenance is current per the PM schedule" },
    { id: "eq-4", category: "Equipment & Tooling",         question: "5S / housekeeping standards are maintained at the workstation" },
  ];

  return items.map(item => ({
    id: item.id,
    category: item.category,
    question: item.question,
    result: (overrides as any)[item.id]?.result ?? "yes",
    note: (overrides as any)[item.id]?.note ?? "",
  }));
}

async function main() {
  console.log("Seeding IATF product audits, process audits, and schedules for CCI Chemical…");

  // ── Clear existing demo data ───────────────────────────────────────────────
  await db.delete(iatfProductAudits).where(eq(iatfProductAudits.userId, USER_ID));
  await db.delete(iatfMfgProcessAudits).where(eq(iatfMfgProcessAudits.userId, USER_ID));
  await db.delete(iatfAuditSchedule).where(eq(iatfAuditSchedule.userId, USER_ID));
  console.log("Cleared existing IATF audit data.");

  // ── §9.2.2.3 Product Audits ───────────────────────────────────────────────
  const productAudits = [
    {
      userId: USER_ID,
      auditDate: "2026-04-10",
      shift: "Day",
      auditor: "Maria Santos, QC Inspector",
      partNumber: "CCI-2240",
      partName: "Polyurethane Protective Coating",
      lotNumber: "PU-2240-2604A",
      revisionLevel: "Rev C",
      quantitySampled: 12,
      customerName: "Midwest Auto Stamping, LLC",
      controlPlanRef: "CP-2240-Rev3",
      result: "pass",
      checklistItems: makeProductChecklist(),
      findings: "All 19 checklist items passed. COA reviewed and attached. GHS SDS on file. Product meets all customer-specific requirements for Midwest Auto Stamping.",
      nonconformances: "",
      disposition: "Approved — ship to customer",
      correctiveActionRef: "",
      managementNotified: false,
      notifiedBy: "",
    },
    {
      userId: USER_ID,
      auditDate: "2026-04-18",
      shift: "Afternoon",
      auditor: "James Okonkwo, Lead QC",
      partNumber: "CCI-4410",
      partName: "Industrial Solvent Blend #4",
      lotNumber: "ISB-4410-2604C",
      revisionLevel: "Rev B",
      quantitySampled: 8,
      customerName: "Gulf Coast Finishing, Inc.",
      controlPlanRef: "CP-4410-Rev2",
      result: "conditional",
      checklistItems: makeProductChecklist({
        "fnc-1": { result: "fail", note: "pH measured at 7.3 — spec is 6.8–7.1. Batch held pending re-test after pH adjustment." },
        "doc-1": { result: "fail", note: "COA was not completed at time of audit — QC lead notified to complete before release." },
      }),
      findings: "2 nonconformances identified: (1) pH out of range at 7.3 vs. spec 6.8–7.1; (2) COA not yet completed. Batch conditionally held pending pH re-check and COA completion. All other items passed.",
      nonconformances: "NC-1: pH 7.3 outside spec 6.8–7.1. NC-2: COA not completed at time of audit.",
      disposition: "Hold — awaiting pH re-test and COA completion",
      correctiveActionRef: "CAR-2026-047",
      managementNotified: true,
      notifiedBy: "James Okonkwo → Director of Quality (email + verbal)",
    },
    {
      userId: USER_ID,
      auditDate: "2026-04-25",
      shift: "Day",
      auditor: "Maria Santos, QC Inspector",
      partNumber: "CCI-1105",
      partName: "Metal Degreaser Concentrate",
      lotNumber: "MD-1105-2604F",
      revisionLevel: "Rev A",
      quantitySampled: 20,
      customerName: "Precision Machining Group",
      controlPlanRef: "CP-1105-Rev1",
      result: "pass",
      checklistItems: makeProductChecklist({
        "vis-1": { result: "na", note: "Color variation is an inherent characteristic of this formulation batch — within acceptable range per spec note." },
      }),
      findings: "18 items passed, 1 marked N/A (color variation acceptable per spec). No nonconformances. Product ready for shipment.",
      nonconformances: "",
      disposition: "Approved — ship to customer",
      correctiveActionRef: "",
      managementNotified: false,
      notifiedBy: "",
    },
  ];

  const insertedProductAudits = await db.insert(iatfProductAudits).values(productAudits).returning();
  console.log(`Inserted ${insertedProductAudits.length} product audits.`);

  // ── §9.2.2.4 Manufacturing Process Audits ─────────────────────────────────
  const processAudits = [
    {
      userId: USER_ID,
      auditDate: "2026-04-08",
      shift: "Day",
      processName: "Chemical Blending",
      workstation: "Blending Bay 1 — Reactor R-101",
      auditor: "Carlos Mendez, Process Auditor",
      controlPlanRef: "CP-BLEND-Rev4",
      productionOrder: "PO-2026-1182",
      partNumber: "CCI-2240",
      result: "conforming",
      turtleInputs: "Raw material chemicals (drums A, B, C per formula CCI-2240-Rev3), Purified water, Blending batch ticket, Approved formula card",
      turtleOutputs: "Blended intermediate batch — COA required, Release approval before filling",
      turtleEquipment: "Reactor R-101 (1000L SS), Agitator Motor M-101, pH meter (Cal. 2026-07-15), Temperature probe (Cal. 2026-05-20), Load cells (Cal. 2026-09-01)",
      turtlePersonnel: "1 Certified Blending Operator (Carlos Ruiz, Level II), 1 QC sign-off required at batch completion",
      turtleMethods: "WI-BLEND-005 Rev B — Chemical Blending SOP, CP-BLEND-Rev4 — Control Plan, SDS for all raw materials on file",
      turtleMeasures: "pH (6.8–7.1), Viscosity (450–550 cP @ 25°C), Temperature during blend (60–65°C), Batch weight ±0.5%",
      turtleEnvironment: "Controlled chemical blending area — HVAC active, explosion-proof equipment, temperature 68–72°F, eyewash station verified operational",
      checklistItems: makeProcessChecklist(),
      findings: "All 25 checklist items conformed. Process is fully compliant with control plan CP-BLEND-Rev4. Operator demonstrated knowledge of reaction plan steps. All measuring devices within calibration.",
      nonconformances: "",
      correctiveActionRef: "",
      managementNotified: false,
      notifiedBy: "",
    },
    {
      userId: USER_ID,
      auditDate: "2026-04-15",
      shift: "Afternoon",
      processName: "Filling & Packaging",
      workstation: "Filling Line 2 — Rotary Filler F-201",
      auditor: "James Okonkwo, Lead QC",
      controlPlanRef: "CP-FILL-Rev3",
      productionOrder: "PO-2026-1201",
      partNumber: "CCI-4410",
      result: "conditional",
      turtleInputs: "Approved intermediate blend (batch ticket ISB-4410-2604C), Containers (1-gal HDPE, spec CCI-PKG-044), Labels (Rev B, lot code printed), Safety caps",
      turtleOutputs: "Filled and labeled 1-gal containers, palletized and stretch-wrapped for shipping",
      turtleEquipment: "Rotary filler F-201, Capping machine C-101, Label applicator LA-300, Checkweigher CW-50 (Cal. 2026-06-01), Torque meter TM-12 (Cal. 2026-08-15)",
      turtlePersonnel: "2 Filling Operators (certified per TR-FILL-Level1), 1 Line Lead, QC sign-off at end of run",
      turtleMethods: "WI-FILL-003 Rev C — Filling & Packaging SOP, CP-FILL-Rev3, Customer packaging spec GPS-044-Rev2",
      turtleMeasures: "Fill volume: 1 gal ±0.5%, Cap torque: 18–22 in-lb, Label placement ±3mm, Checkweigher rejection rate <0.1%",
      turtleEnvironment: "Production hall — standard lighting, temperature 70–75°F, 5S audit score 88/100 last quarter",
      checklistItems: makeProcessChecklist({
        "wi-3": { result: "partial", note: "Engineering change notification ECN-2026-18 (label revision B→C) not yet reflected in posted work instructions. Temporary markup applied. Formal WI update overdue." },
        "eq-4": { result: "partial", note: "5S sweep incomplete at station 3 — solvent containers not returned to designated storage area." },
      }),
      findings: "23 items passed, 2 partial findings: (1) Work instruction WI-FILL-003 not updated to reflect ECN-2026-18; (2) 5S compliance partial at station 3. No product holds required. Corrective actions assigned.",
      nonconformances: "PARTIAL-1: WI-FILL-003 not updated for ECN-2026-18 (label rev B→C). PARTIAL-2: 5S deficiency at filling station 3.",
      correctiveActionRef: "CAR-2026-051",
      managementNotified: true,
      notifiedBy: "James Okonkwo → Production Manager (verbal briefing, April 15)",
    },
    {
      userId: USER_ID,
      auditDate: "2026-04-22",
      shift: "Day",
      processName: "Analytical Testing",
      workstation: "QC Lab — Analytical Bench A",
      auditor: "Maria Santos, QC Inspector",
      controlPlanRef: "CP-QC-Rev2",
      productionOrder: "PO-2026-1215",
      partNumber: "CCI-1105",
      result: "conforming",
      turtleInputs: "Retained samples per Sampling Plan SP-QC-001, Lab request form, Approved test methods (ASTM D1293, ASTM D2196), Reference standards (current CofC)",
      turtleOutputs: "Test results entered in LIMS, COA approved and signed, Batch release decision",
      turtleEquipment: "pH meter (Cal. 2026-05-30), Brookfield Viscometer (Cal. 2026-04-30), Analytical balance (Cal. 2026-06-15), UV-Vis Spectrophotometer (Cal. 2026-07-01)",
      turtlePersonnel: "2 QC Analysts (ASTM method certified), Lab Manager sign-off on release",
      turtleMethods: "QP-QC-002 Rev D — Analytical Testing Procedure, SP-QC-001 — Sampling Plan, ASTM D1293 (pH), ASTM D2196 (viscosity)",
      turtleMeasures: "pH ±0.05 accuracy, Viscosity ±5% repeatability, Balance ±0.01g, UV-Vis absorbance per method tolerance",
      turtleEnvironment: "ISO-compliant QC laboratory — temperature 20–22°C, humidity 45–55% RH, HVAC verified, chemical safety cabinet in use",
      checklistItems: makeProcessChecklist(),
      findings: "All 25 items passed. Lab equipment calibration current. Analysts demonstrated correct sample handling and test methods. LIMS entries reviewed and accurate. Full conformance to CP-QC-Rev2.",
      nonconformances: "",
      correctiveActionRef: "",
      managementNotified: false,
      notifiedBy: "",
    },
    {
      userId: USER_ID,
      auditDate: "2026-04-03",
      shift: "Night",
      processName: "Chemical Blending",
      workstation: "Blending Bay 2 — Reactor R-102",
      auditor: "Carlos Mendez, Process Auditor",
      controlPlanRef: "CP-BLEND-Rev4",
      productionOrder: "PO-2026-1167",
      partNumber: "CCI-3380",
      result: "nonconforming",
      turtleInputs: "Raw chemicals per formula CCI-3380-Rev2, Blending batch ticket, Approved formula card",
      turtleOutputs: "Blended batch — requires QC disposition before proceed to filling",
      turtleEquipment: "Reactor R-102 (500L SS), Agitator Motor M-102, pH meter (Cal. 2026-07-15), Thermocouple TC-102",
      turtlePersonnel: "1 Blending Operator (night shift — seasonal temp worker), 1 QC phone sign-off",
      turtleMethods: "WI-BLEND-005 Rev B, CP-BLEND-Rev4",
      turtleMeasures: "pH, Viscosity, Temperature, Batch weight",
      turtleEnvironment: "Blending area, night shift — standard controls",
      checklistItems: makeProcessChecklist({
        "op-1": { result: "no", note: "Operator on duty (temp worker T. Garcia) has not yet completed blending certification for chemical CCI-3380 formulation. Training record missing for this product." },
        "op-2": { result: "no", note: "Training record for T. Garcia does not include CCI-3380 process qualification — only CCI-2240 is certified." },
        "pp-2": { result: "no", note: "Temperature log shows blend temperature reached 72°C — spec max is 68°C. Temperature excursion not documented or reported at time of occurrence." },
        "wi-1": { result: "partial", note: "Work instructions available but outdated — Rev B posted, Rev C issued 2 weeks ago and not yet distributed to night shift." },
        "nc-1": { result: "no", note: "Batch was not placed on hold when temperature excursion was detected — continued processing without escalation." },
      }),
      findings: "CRITICAL NONCONFORMANCE: Uncertified operator ran CCI-3380 blending process. Temperature exceeded spec limit (72°C vs. max 68°C) with no immediate containment or escalation. 5 checklist items failed. Batch placed on full hold. CAR issued. Night shift supervisor and QC Director notified immediately.",
      nonconformances: "NC-1 (CRITICAL): Uncertified operator performed controlled blending process. NC-2 (MAJOR): Temperature excursion 72°C vs. spec max 68°C — no escalation. NC-3: WI-BLEND-005 Rev B at workstation, current Rev C not distributed. NC-4: Batch not held on temperature excursion detection.",
      correctiveActionRef: "CAR-2026-039",
      managementNotified: true,
      notifiedBy: "Carlos Mendez → QC Director + Production Manager + HR (same night, phone)",
    },
  ];

  const insertedProcessAudits = await db.insert(iatfMfgProcessAudits).values(processAudits).returning();
  console.log(`Inserted ${insertedProcessAudits.length} process audits.`);

  // ── IATF Audit Schedule ───────────────────────────────────────────────────
  const scheduleEntries = [
    // Product Audit Schedules (§9.2.2.3)
    {
      userId: USER_ID,
      auditType: "product",
      title: "Polyurethane Protective Coating",
      partNumber: "CCI-2240",
      processName: "",
      workstation: "",
      auditorAssigned: "Maria Santos, QC Inspector",
      frequency: "monthly",
      nextDueDate: "2026-05-10",
      lastCompletedDate: "2026-04-10",
      status: "active",
      notes: "Customer-specific audit per Midwest Auto Stamping CSR §8.6. Focus on pH, viscosity, and label compliance.",
    },
    {
      userId: USER_ID,
      auditType: "product",
      title: "Industrial Solvent Blend #4",
      partNumber: "CCI-4410",
      processName: "",
      workstation: "",
      auditorAssigned: "James Okonkwo, Lead QC",
      frequency: "monthly",
      nextDueDate: "2026-05-18",
      lastCompletedDate: "2026-04-18",
      status: "active",
      notes: "Elevated monitoring following CAR-2026-047 (pH excursion). Frequency to remain monthly until 3 consecutive passes. COA completion is a gate item.",
    },
    {
      userId: USER_ID,
      auditType: "product",
      title: "Metal Degreaser Concentrate",
      partNumber: "CCI-1105",
      processName: "",
      workstation: "",
      auditorAssigned: "Maria Santos, QC Inspector",
      frequency: "quarterly",
      nextDueDate: "2026-07-25",
      lastCompletedDate: "2026-04-25",
      status: "active",
      notes: "Standard quarterly product audit per Precision Machining Group CSR. No open CARs.",
    },
    {
      userId: USER_ID,
      auditType: "product",
      title: "Rust Inhibitor EC-Series",
      partNumber: "CCI-3380",
      processName: "",
      workstation: "",
      auditorAssigned: "James Okonkwo, Lead QC",
      frequency: "weekly",
      nextDueDate: "2026-04-29",
      lastCompletedDate: "2026-04-03",
      status: "active",
      notes: "INCREASED FREQUENCY — temporary weekly audit following CAR-2026-039 (operator + temperature excursion). Revert to monthly after 4 consecutive passes and CAR closure.",
    },

    // Process Audit Schedules (§9.2.2.4)
    {
      userId: USER_ID,
      auditType: "process",
      title: "Chemical Blending",
      partNumber: "",
      processName: "Chemical Blending",
      workstation: "Blending Bays 1 & 2",
      auditorAssigned: "Carlos Mendez, Process Auditor",
      frequency: "per_shift",
      nextDueDate: "2026-04-28",
      lastCompletedDate: "2026-04-22",
      status: "active",
      notes: "Per-shift audits required per IATF §9.2.2.4. Rotating auditors across all 3 shifts. Night shift is HIGH PRIORITY following CAR-2026-039.",
    },
    {
      userId: USER_ID,
      auditType: "process",
      title: "Filling & Packaging",
      partNumber: "",
      processName: "Filling & Packaging",
      workstation: "Filling Lines 1, 2, 3",
      auditorAssigned: "James Okonkwo, Lead QC",
      frequency: "weekly",
      nextDueDate: "2026-04-29",
      lastCompletedDate: "2026-04-15",
      status: "active",
      notes: "Weekly audit frequency. Verify WI-FILL-003 updated to Rev C (ECN-2026-18) and 5S compliance at all three lines (follow-up from CAR-2026-051).",
    },
    {
      userId: USER_ID,
      auditType: "process",
      title: "Analytical Testing",
      partNumber: "",
      processName: "Analytical Testing",
      workstation: "QC Lab — All Benches",
      auditorAssigned: "Maria Santos, QC Inspector",
      frequency: "monthly",
      nextDueDate: "2026-05-22",
      lastCompletedDate: "2026-04-22",
      status: "active",
      notes: "Monthly lab process audit. Verify calibration status of all lab instruments, analyst certification records, and LIMS data integrity.",
    },
    {
      userId: USER_ID,
      auditType: "process",
      title: "Warehouse & Shipping",
      partNumber: "",
      processName: "Warehouse & Shipping",
      workstation: "Warehouse / Dock Area",
      auditorAssigned: "Carlos Mendez, Process Auditor",
      frequency: "quarterly",
      nextDueDate: "2026-07-01",
      lastCompletedDate: "2026-01-15",
      status: "active",
      notes: "Quarterly audit covers receiving inspection, finished goods segregation, FIFO compliance, packaging integrity on outbound shipments, and HazMat placarding.",
    },
  ];

  const insertedSchedule = await db.insert(iatfAuditSchedule).values(scheduleEntries).returning();
  console.log(`Inserted ${insertedSchedule.length} audit schedule entries.`);

  console.log("\n✅ IATF audit seed complete!");
  console.log(`   - ${insertedProductAudits.length} product audit records (§9.2.2.3)`);
  console.log(`   - ${insertedProcessAudits.length} process audit records (§9.2.2.4)`);
  console.log(`   - ${insertedSchedule.length} audit schedule entries (4 product + 4 process)`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
