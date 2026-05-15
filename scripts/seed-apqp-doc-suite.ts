/**
 * Seed: APQP Documentation Suite demo data — CCI Chemical, Inc.
 * Populates Process Flow, PFMEA, Control Plan, and Inspection Sheets
 * for both existing APQP projects.
 *
 * Project 1 (id=1): Ford F-150 2027 — DOT 4+ Brake Fluid Program
 * Project 2 (id=2): GM Ultium EV — OAT Coolant Program
 *
 * Run: npx tsx scripts/seed-apqp-doc-suite.ts
 */

import { db } from "../server/db";
import {
  apqpProcessSteps, apqpPfmeaRows, apqpControlPlanRows,
  apqpInspectionSheets, apqpInspectionRows,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

const USER_ID = "54320068";

// ─── Clear existing doc suite data for both projects ─────────────────────────
async function clearProject(projectId: number) {
  const sheets = await db.select({ id: apqpInspectionSheets.id })
    .from(apqpInspectionSheets)
    .where(and(eq(apqpInspectionSheets.apqpProjectId, projectId), eq(apqpInspectionSheets.userId, USER_ID)));
  for (const s of sheets) {
    await db.delete(apqpInspectionRows).where(eq(apqpInspectionRows.inspectionSheetId, s.id));
  }
  await db.delete(apqpInspectionSheets).where(and(eq(apqpInspectionSheets.apqpProjectId, projectId), eq(apqpInspectionSheets.userId, USER_ID)));
  await db.delete(apqpControlPlanRows).where(and(eq(apqpControlPlanRows.apqpProjectId, projectId), eq(apqpControlPlanRows.userId, USER_ID)));
  await db.delete(apqpPfmeaRows).where(and(eq(apqpPfmeaRows.apqpProjectId, projectId), eq(apqpPfmeaRows.userId, USER_ID)));
  await db.delete(apqpProcessSteps).where(and(eq(apqpProcessSteps.apqpProjectId, projectId), eq(apqpProcessSteps.userId, USER_ID)));
  console.log(`  ✓ Cleared project ${projectId}`);
}

// ─── PROJECT 1: Ford F-150 2027 — DOT 4+ Brake Fluid ─────────────────────────
async function seedProject1() {
  const pid = 1;
  console.log("\n▶ Seeding Project 1: Ford F-150 DOT 4+ Brake Fluid");

  // ── Process Flow Steps ───────────────────────────────────────────────────
  const [s10] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "10", operationName: "Raw Material Receiving & Inspection",
    operationType: "inspection", machine: "Receiving Dock, GC-MS, Karl Fischer Analyzer",
    description: "Verify CoA against spec: TEGME lot quality, inhibitor package, mono-ethylene glycol purity. Barcode scan each drum into IMS. Quarantine pending QC release.",
    specialChars: ["SC"],
    inputs: ["Incoming drum lots", "Supplier CoA", "Purchase order"],
    outputs: ["QC-approved raw material", "Quarantine tag or IMS release scan"],
    reviewFlag: false, stepOrder: 0,
  }).returning();

  const [s20] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "20", operationName: "Pre-Weigh & Charge",
    operationType: "operation", machine: "Mettler Toledo ICS685 Floor Scale, Manual pumps",
    description: "Weigh TEGME, diethylene glycol monobutyl ether (DGBE), borate ester inhibitor, and pH buffer per Batch Record BF-BR-001. Charge to 500-gal jacketed stainless blending vessel.",
    specialChars: [],
    inputs: ["QC-released raw materials", "Batch record BF-BR-001"],
    outputs: ["Charged blending vessel", "Batch record weight entries"],
    reviewFlag: false, stepOrder: 1,
  }).returning();

  const [s30] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "30", operationName: "Blending & Mixing",
    operationType: "operation", machine: "Top-entry agitator, jacketed vessel, Temperature PLC",
    description: "Blend at 60 ± 5 °C for 45 min minimum. Maintain agitator at 45 RPM. Monitor temperature continuously. Inhibitor must be fully dissolved before advancing.",
    specialChars: ["KPC"],
    inputs: ["Charged vessel", "Blending SOP BF-SOP-003"],
    outputs: ["Homogeneous blend ready for QC test"],
    reviewFlag: false, stepOrder: 2,
  }).returning();

  const [s40] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "40", operationName: "In-Process Quality Testing",
    operationType: "inspection", machine: "Pensky-Martens Flash Point Tester, pH Meter, Viscometer",
    description: "Test batch sample per FMVSS 116 and Ford WSS-M97B44-D: dry boiling point ≥ 230 °C, wet boiling point ≥ 155 °C, pH 7.0–11.5, kinematic viscosity ≤ 1500 mm²/s at −40 °C. Approve batch or initiate CAPA.",
    specialChars: ["CC", "KPC"],
    inputs: ["Blended batch sample", "FMVSS 116 test protocol"],
    outputs: ["Test results log", "Batch release or rejection decision"],
    reviewFlag: false, stepOrder: 3,
  }).returning();

  const [s50] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "50", operationName: "Filtration",
    operationType: "operation", machine: "10-micron bag filter housing, transfer pump",
    description: "Transfer released batch through 10-micron polypropylene bag filter to holding tank. Monitor filter differential pressure ≤ 15 PSI. Replace filter if exceeded.",
    specialChars: [],
    inputs: ["QC-approved batch"],
    outputs: ["Filtered product in holding tank"],
    reviewFlag: false, stepOrder: 4,
  }).returning();

  const [s60] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "60", operationName: "Filling & Sealing",
    operationType: "operation", machine: "Automated filler FILL-01, torque tester, label applicator",
    description: "Fill 12-oz or 32-oz HDPE bottles to ± 2% net weight. Cap torque 18–22 in-lbs. Apply Ford-approved label with batch code, lot#, DOT 4+ marking, and expiry date.",
    specialChars: ["SC"],
    inputs: ["Filtered product", "HDPE bottles", "Ford-approved label artwork"],
    outputs: ["Filled, sealed, labeled bottles"],
    reviewFlag: false, stepOrder: 5,
  }).returning();

  const [s70] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "70", operationName: "Final Inspection & Release",
    operationType: "inspection", machine: "Visual inspection station, Torque checker",
    description: "100% visual: label placement, cap seal, fill level. Statistical sampling AQL 1.0 Level II for dimensional and torque verification. Affix QC release sticker. Enter to WMS.",
    specialChars: ["SC"],
    inputs: ["Filled bottles", "Inspection plan QC-IP-BF-001"],
    outputs: ["Approved FG pallet", "Batch trace record"],
    reviewFlag: false, stepOrder: 6,
  }).returning();

  const [s80] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "80", operationName: "Packaging & Palletizing",
    operationType: "operation", machine: "Case packer, stretch wrapper, pallet jack",
    description: "Pack 12 units per case. Stack 48 cases per pallet. Stretch-wrap and apply pallet placard with lot#, PO, ship-to address. Stage in designated Ford-dedicated lane.",
    specialChars: [],
    inputs: ["Released FG bottles", "Ford packaging spec PACK-BF-27"],
    outputs: ["Palletized FG ready for shipment"],
    reviewFlag: false, stepOrder: 7,
  }).returning();

  const steps = [s10, s20, s30, s40, s50, s60, s70, s80];
  console.log(`  ✓ ${steps.length} process flow steps`);

  // ── PFMEA Rows ────────────────────────────────────────────────────────────
  const [p1] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s10.id, processStep: "10 — Raw Material Receiving",
    processFunction: "Verify incoming TEGME and inhibitor lots meet specification before use",
    failureMode: "Non-conforming lot accepted — off-spec TEGME purity or inhibitor concentration",
    failureEffect: "Batch fails dry/wet boiling point test; product recall risk; Ford CSR non-compliance",
    severity: 9, classification: "CC",
    failureCause: "Supplier CoA falsified or mis-labeled; analyst skips GC-MS verification step",
    preventionControl: "Approved Supplier List (ASL); mandatory per-lot GC-MS verification procedure RM-SOP-001",
    occurrence: 3,
    detectionControl: "GC-MS lab analysis prior to QC release; IMS quarantine hold until results entered",
    detection: 2, rpn: 54,
    recommendedAction: "Add second-party lab verification for first 3 lots from any new TEGME supplier; implement barcode-enforced hold-tag scanning",
    responsibility: "Elena Vasquez, Quality Manager",
    targetDate: "2026-07-15",
    actionTaken: "SOP RM-SOP-001 revised to require dual analyst sign-off on GC-MS results. Implemented.",
    resultingSeverity: 9, resultingOccurrence: 2, resultingDetection: 2, resultingRpn: 36,
    reviewFlag: false, rowOrder: 0,
  }).returning();

  const [p2] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s30.id, processStep: "30 — Blending & Mixing",
    processFunction: "Produce homogeneous brake fluid blend at correct temperature and agitation",
    failureMode: "Incomplete blending — inhibitor package not fully dissolved",
    failureEffect: "Phase separation in field; corrosion of ABS/ESC module components; vehicle safety incident",
    severity: 10, classification: "KPC",
    failureCause: "Agitator failure mid-batch; temperature dropout below 55 °C; shortened blend time",
    preventionControl: "PLC-controlled temperature interlock (minimum 55 °C before agitator start); minimum 45-minute timer enforced by SCADA",
    occurrence: 3,
    detectionControl: "Visual clarity check (turbidity absence) before advancing; GC-MS inhibitor concentration test at step 40",
    detection: 3, rpn: 90,
    recommendedAction: "Install agitator vibration sensor with auto-alarm and batch hold; add turbidity NTU test to in-process spec",
    responsibility: "Marcus Webb, Production Supervisor",
    targetDate: "2026-06-30",
    actionTaken: "Agitator vibration sensor installed. Turbidity NTU test (< 5 NTU) added to QC step 40 spec.",
    resultingSeverity: 10, resultingOccurrence: 2, resultingDetection: 2, resultingRpn: 40,
    reviewFlag: false, rowOrder: 1,
  }).returning();

  const [p3] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s40.id, processStep: "40 — In-Process Quality Testing",
    processFunction: "Verify batch meets FMVSS 116 and Ford WSS-M97B44-D dry/wet boiling point requirements",
    failureMode: "Test result falsification or measurement error — out-of-spec batch passed to filling",
    failureEffect: "DOT 4+ non-conforming product reaches Ford Tier 1 customer; potential warranty claim and CSR violation",
    severity: 9, classification: "CC",
    failureCause: "Tester instrument not calibrated; analyst transcription error; rush pressure overrides SOP",
    preventionControl: "Calibrated instruments with NIST-traceable certs; electronic LIMS data entry (no manual transcription); dual-release sign-off SOP",
    occurrence: 2,
    detectionControl: "Calibration due-date interlock in LIMS (instrument locked if past due); supervisor review of all boiling point results",
    detection: 2, rpn: 36,
    recommendedAction: "Implement automated instrument data transfer to LIMS; include boiling-point test in management review KPI dashboard",
    responsibility: "Elena Vasquez, Quality Manager",
    targetDate: "2026-09-01",
    actionTaken: "",
    resultingSeverity: null, resultingOccurrence: null, resultingDetection: null, resultingRpn: null,
    reviewFlag: false, rowOrder: 2,
  }).returning();

  const [p4] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s60.id, processStep: "60 — Filling & Sealing",
    processFunction: "Fill bottles to correct net weight within ± 2%; apply proper cap torque and Ford-approved label",
    failureMode: "Underfill — bottle below minimum net weight specification",
    failureEffect: "Ford customer returns; potential FMVSS 116 short-fill violation; brand damage",
    severity: 7, classification: "SC",
    failureCause: "Filler nozzle partially blocked; product viscosity variation at low ambient temp; filling speed too high",
    preventionControl: "Automatic in-line checkweigher with reject; filler nozzle cleaned every 2 hours per PM-PM-BF-004; viscosity verified at QC step 40",
    occurrence: 3,
    detectionControl: "100% in-line checkweigher at filler exit (reject gate); AQL sampling at final inspection step 70",
    detection: 2, rpn: 42,
    recommendedAction: "Add trend SPC chart for filler net weight to catch drift before rejects; tie checkweigher data to batch record automatically",
    responsibility: "Marcus Webb, Production Supervisor",
    targetDate: "2026-07-01",
    actionTaken: "SPC chart for filler weight added to SCADA dashboard. Checkweigher data now auto-logged.",
    resultingSeverity: 7, resultingOccurrence: 2, resultingDetection: 2, resultingRpn: 28,
    reviewFlag: false, rowOrder: 3,
  }).returning();

  const [p5] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s70.id, processStep: "70 — Final Inspection & Release",
    processFunction: "100% visual and AQL sampling to prevent non-conforming product from shipment",
    failureMode: "Mislabeled bottle — wrong grade (DOT 3 label on DOT 4+ product) or missing expiry date",
    failureEffect: "Field mix-up of brake fluid grade; vehicle safety risk if DOT 3 system filled with DOT 5 equivalent; regulatory FMVSS violation",
    severity: 9, classification: "CC",
    failureCause: "Artwork changeover error in label applicator setup; label reel not verified before production start",
    preventionControl: "First-article label check with Ford-approved artwork file before each production run; label reel barcode scan-to-match SOP",
    occurrence: 2,
    detectionControl: "100% vision system label read; final inspector checks label grade designation on 5% of cases",
    detection: 2, rpn: 36,
    recommendedAction: "Add vision system OCR to read and verify DOT grade text string on every bottle; auto-reject on mismatch",
    responsibility: "Elena Vasquez, Quality Manager",
    targetDate: "2026-08-01",
    actionTaken: "",
    resultingSeverity: null, resultingOccurrence: null, resultingDetection: null, resultingRpn: null,
    reviewFlag: false, rowOrder: 4,
  }).returning();

  const pfmea = [p1, p2, p3, p4, p5];
  console.log(`  ✓ ${pfmea.length} PFMEA rows`);

  // ── Control Plan Rows ─────────────────────────────────────────────────────
  const cpData = [
    {
      pfmeaRowId: p1.id, processStepId: s10.id,
      partProcessNumber: "10", processName: "Raw Material Receiving",
      machineDeviceJig: "GC-MS, Karl Fischer Analyzer, Density Meter",
      charNumber: "C-01", charType: "product" as const, charName: "TEGME Purity (% by GC)",
      specialCharClass: "CC", productSpec: "≥ 99.0% purity per supplier spec RM-001",
      evalMeasureTech: "GC-MS per ASTM E1676", sampleSize: "100 mL per drum",
      sampleFrequency: "Every incoming lot", controlMethod: "Lab test + LIMS release gate",
      reactionPlan: "Quarantine lot, notify supplier, issue SCAR, reject or return",
    },
    {
      pfmeaRowId: p1.id, processStepId: s10.id,
      partProcessNumber: "10", processName: "Raw Material Receiving",
      machineDeviceJig: "Karl Fischer Moisture Analyzer",
      charNumber: "C-02", charType: "product" as const, charName: "Water Content (ppm)",
      specialCharClass: "SC", productSpec: "≤ 200 ppm per FMVSS 116 Table 1",
      evalMeasureTech: "Karl Fischer titration per ASTM D1364", sampleSize: "50 mL per lot",
      sampleFrequency: "Every incoming lot", controlMethod: "Lab test + LIMS release gate",
      reactionPlan: "Reject lot; hold blending until replacement received",
    },
    {
      pfmeaRowId: p2.id, processStepId: s30.id,
      partProcessNumber: "30", processName: "Blending & Mixing",
      machineDeviceJig: "SCADA temperature controller, Agitator VFD",
      charNumber: "C-03", charType: "process" as const, charName: "Blend Temperature",
      specialCharClass: "KPC", productSpec: "60 ± 5 °C for minimum 45 min",
      evalMeasureTech: "Calibrated RTD sensor (NIST traceable, Cal interval 6 mo)", sampleSize: "Continuous",
      sampleFrequency: "Continuous (PLC log every 60 s)", controlMethod: "SCADA PLC interlock — batch hold if T < 55 °C",
      reactionPlan: "Halt agitator, escalate to Production Supervisor, re-heat and re-blend with fresh timer",
    },
    {
      pfmeaRowId: p3.id, processStepId: s40.id,
      partProcessNumber: "40", processName: "In-Process QC Testing",
      machineDeviceJig: "Pensky-Martens Closed Cup Flash Point Tester (ASTM D93)",
      charNumber: "C-04", charType: "product" as const, charName: "Dry Boiling Point (°C)",
      specialCharClass: "CC", productSpec: "≥ 230 °C per FMVSS 116 and Ford WSS-M97B44-D",
      evalMeasureTech: "ASTM D1120 equilibrium reflux boiling method", sampleSize: "200 mL per batch",
      sampleFrequency: "Once per batch before filling", controlMethod: "LIMS batch release gate — no filling without passing result",
      reactionPlan: "Hold batch, investigate blend ratio, reject or rework if confirmed OOS, issue CAPA",
    },
    {
      pfmeaRowId: p3.id, processStepId: s40.id,
      partProcessNumber: "40", processName: "In-Process QC Testing",
      machineDeviceJig: "pH Meter (calibrated, 2-point)",
      charNumber: "C-05", charType: "product" as const, charName: "pH",
      specialCharClass: "SC", productSpec: "7.0 – 11.5 per FMVSS 116",
      evalMeasureTech: "ASTM D1121 pH method, 2-point calibration with NIST buffers", sampleSize: "100 mL per batch",
      sampleFrequency: "Once per batch", controlMethod: "LIMS batch release gate",
      reactionPlan: "Adjust inhibitor concentration per R&D memo, re-test; reject if non-adjustable",
    },
    {
      pfmeaRowId: p4.id, processStepId: s60.id,
      partProcessNumber: "60", processName: "Filling & Sealing",
      machineDeviceJig: "In-line checkweigher (± 0.5 g accuracy), Torque tester",
      charNumber: "C-06", charType: "product" as const, charName: "Net Fill Weight (oz)",
      specialCharClass: "SC", productSpec: "12.0 oz ± 2% (11.76 – 12.24 oz) per Ford PACK-BF-27",
      evalMeasureTech: "100% in-line checkweigher; verified with NIST-traceable weight set each shift", sampleSize: "100% (every bottle)",
      sampleFrequency: "Continuous — every unit", controlMethod: "Auto-reject gate on checkweigher OOT; SPC X-bar/R chart every 30 min",
      reactionPlan: "Stop filler, inspect nozzles, adjust fill head, re-zero checkweigher, re-start; quarantine last 50 units",
    },
    {
      pfmeaRowId: p4.id, processStepId: s60.id,
      partProcessNumber: "60", processName: "Filling & Sealing",
      machineDeviceJig: "Digital torque tester (mountable probe)",
      charNumber: "C-07", charType: "product" as const, charName: "Cap Torque (in-lbs)",
      specialCharClass: "", productSpec: "18 – 22 in-lbs per Ford PACK-BF-27",
      evalMeasureTech: "Digital torque meter per ASTM D4895", sampleSize: "5 bottles",
      sampleFrequency: "Every 30 min and at start/end of run", controlMethod: "Attribute sampling + SPC chart",
      reactionPlan: "Adjust torque head setting, quarantine since last good check, re-test",
    },
    {
      pfmeaRowId: p5.id, processStepId: s70.id,
      partProcessNumber: "70", processName: "Final Inspection",
      machineDeviceJig: "Vision system (Cognex) + manual inspector",
      charNumber: "C-08", charType: "product" as const, charName: "Label Grade Designation (DOT 4+)",
      specialCharClass: "CC", productSpec: "Label must read 'DOT 4+' — zero tolerance for incorrect grade text per Ford CSR",
      evalMeasureTech: "Vision system OCR read on every bottle; manual AQL Level II 5% label audit", sampleSize: "100% (auto) + AQL 5%",
      sampleFrequency: "Every bottle (vision); every 30 min (manual audit)", controlMethod: "Auto-reject on vision mismatch; manual audit log",
      reactionPlan: "Stop line, quarantine since last verified good, re-verify artwork file, contact Ford QE",
    },
  ];

  const cpRows: Array<{ id: number }> = [];
  for (let i = 0; i < cpData.length; i++) {
    const [r] = await db.insert(apqpControlPlanRows).values({
      apqpProjectId: pid, userId: USER_ID,
      ...cpData[i],
      reviewFlag: false, rowOrder: i,
    }).returning();
    cpRows.push(r);
  }
  console.log(`  ✓ ${cpRows.length} control plan rows`);

  // ── Inspection Sheet ──────────────────────────────────────────────────────
  const [sheet] = await db.insert(apqpInspectionSheets).values({
    apqpProjectId: pid, userId: USER_ID,
    sheetTitle: "Production Run Inspection — DOT 4+ Lot BF-2026-0412",
    partNumber: "BF-DOT4P-F150-27",
    partName: "DOT 4+ Brake Fluid — Ford F-150 2027 Program",
    inspector: "Elena Vasquez",
    inspectionDate: "2026-05-12",
    lotNumber: "BF-2026-0412",
    quantity: "1,200 bottles (100 cases)",
    status: "pass",
    notes: "All characteristics within specification. Released per QC-IP-BF-001.",
  }).returning();

  const inspRows = [
    { charName: "TEGME Purity (% by GC)", specification: "≥ 99.0%", measureTech: "GC-MS per ASTM E1676", sampleSize: "100 mL per drum", measurements: [{ value: "99.6%", status: "pass" as const }, { value: "99.4%", status: "pass" as const }], status: "pass" as const },
    { charName: "Water Content (ppm)", specification: "≤ 200 ppm", measureTech: "Karl Fischer ASTM D1364", sampleSize: "50 mL per lot", measurements: [{ value: "142 ppm", status: "pass" as const }], status: "pass" as const },
    { charName: "Blend Temperature", specification: "60 ± 5 °C / 45 min min", measureTech: "Calibrated RTD (SCADA)", sampleSize: "Continuous", measurements: [{ value: "60.3°C @ 45:00", status: "pass" as const }], status: "pass" as const },
    { charName: "Dry Boiling Point (°C)", specification: "≥ 230 °C", measureTech: "ASTM D1120", sampleSize: "200 mL", measurements: [{ value: "238.5°C", status: "pass" as const }], status: "pass" as const },
    { charName: "pH", specification: "7.0 – 11.5", measureTech: "ASTM D1121 pH meter", sampleSize: "100 mL", measurements: [{ value: "9.2", status: "pass" as const }], status: "pass" as const },
    { charName: "Net Fill Weight (oz)", specification: "12.0 oz ± 2%", measureTech: "In-line checkweigher", sampleSize: "100% + spot check 5", measurements: [{ value: "12.04 oz", status: "pass" as const }, { value: "11.98 oz", status: "pass" as const }, { value: "12.10 oz", status: "pass" as const }, { value: "12.01 oz", status: "pass" as const }, { value: "11.96 oz", status: "pass" as const }], status: "pass" as const },
    { charName: "Cap Torque (in-lbs)", specification: "18 – 22 in-lbs", measureTech: "Digital torque meter ASTM D4895", sampleSize: "5 bottles / 30 min", measurements: [{ value: "20.1 in-lbs", status: "pass" as const }, { value: "19.8 in-lbs", status: "pass" as const }], status: "pass" as const },
    { charName: "Label Grade Designation", specification: "Must read 'DOT 4+' — zero tolerance", measureTech: "Vision OCR + manual AQL 5%", sampleSize: "100% (auto) + 5% manual", measurements: [{ value: "PASS — DOT 4+ confirmed all", status: "pass" as const }], status: "pass" as const },
  ];

  for (let i = 0; i < inspRows.length; i++) {
    const cp = cpRows[i];
    await db.insert(apqpInspectionRows).values({
      inspectionSheetId: sheet.id,
      controlPlanRowId: cp?.id ?? null,
      userId: USER_ID,
      ...inspRows[i],
      notes: "",
      rowOrder: i,
    });
  }
  console.log(`  ✓ Inspection sheet with ${inspRows.length} rows`);
}

// ─── PROJECT 2: GM Ultium EV — OAT Coolant Program ───────────────────────────
async function seedProject2() {
  const pid = 2;
  console.log("\n▶ Seeding Project 2: GM Ultium EV — OAT Coolant");

  // ── Process Flow Steps ───────────────────────────────────────────────────
  const [s10] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "10", operationName: "Raw Material Receiving — OAT Inhibitor & Ethylene Glycol",
    operationType: "inspection", machine: "Receiving dock, ICP-OES spectrometer, Density meter",
    description: "Verify OAT inhibitor package (2-EHA, sebacate, tolyltriazole) and ethylene glycol base per CoA. Check phosphate-free, silicate-free, amine-free compliance (GM DEXOS D spec). Quarantine in IMS until QC release.",
    specialChars: ["CC"],
    inputs: ["Incoming tanker/drum lots", "Supplier CoA", "GM DEXOS D specification"],
    outputs: ["QC-released OAT inhibitor and EG in holding tanks"],
    reviewFlag: false, stepOrder: 0,
  }).returning();

  const [s20] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "20", operationName: "DI Water Preparation",
    operationType: "operation", machine: "Reverse osmosis + DI polisher system, conductivity meter",
    description: "Produce deionized water with conductivity ≤ 1 µS/cm. Log conductivity every 4 hours. Replace RO membranes per PM schedule PM-PM-RO-001.",
    specialChars: ["KPC"],
    inputs: ["Municipal water supply"],
    outputs: ["DI water with conductivity ≤ 1 µS/cm"],
    reviewFlag: false, stepOrder: 1,
  }).returning();

  const [s30] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "30", operationName: "Pre-mix: OAT Inhibitor + DI Water",
    operationType: "operation", machine: "500-gal SS vessel, agitator, pH meter",
    description: "Blend OAT inhibitor concentrate with DI water to create inhibitor pre-mix per Batch Record CV-BR-002. Target inhibitor concentration 6.0 ± 0.5% w/w. Confirm pH 8.0–9.0 before advancing.",
    specialChars: ["SC"],
    inputs: ["OAT inhibitor lot", "DI water"],
    outputs: ["Inhibitor pre-mix solution ready for blending"],
    reviewFlag: false, stepOrder: 2,
  }).returning();

  const [s40] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "40", operationName: "Final Blending — EG + Pre-mix",
    operationType: "operation", machine: "2000-gal main blending vessel, inline Coriolis flow meter",
    description: "Blend ethylene glycol and OAT pre-mix in 50:50 ratio by weight using Coriolis mass flow meters. Maintain ± 0.5% blend ratio tolerance. Blend for 30 min at 25 °C with agitation.",
    specialChars: ["KPC", "CC"],
    inputs: ["OAT pre-mix", "EG lot", "Batch record CV-BR-002"],
    outputs: ["50/50 OAT coolant blend ready for QC"],
    reviewFlag: false, stepOrder: 3,
  }).returning();

  const [s50] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "50", operationName: "In-Process QC Testing",
    operationType: "inspection", machine: "Freezepoint meter, ICP-OES, pH meter, conductivity analyzer",
    description: "Test per GM DEXOS D and ASTM D3306: freeze point ≤ −34 °C at 50/50, pH 8.0–9.0, chloride ≤ 25 ppm, silicate = 0, phosphate = 0. ICP-OES for inhibitor package elements. Release batch or CAPA.",
    specialChars: ["CC", "KPC"],
    inputs: ["Blended batch sample", "GM DEXOS D test protocol"],
    outputs: ["Batch QC result in LIMS; release or rejection"],
    reviewFlag: false, stepOrder: 4,
  }).returning();

  const [s60] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "60", operationName: "Filtration — 5-micron",
    operationType: "operation", machine: "5-micron absolute-rated polypropylene filter housing",
    description: "Transfer released coolant through 5-micron filter to filling holding tank. Monitor differential pressure. Required for EV heat-exchanger compatibility — no particulates > 5 µm.",
    specialChars: ["SC"],
    inputs: ["QC-released coolant batch"],
    outputs: ["Filtered product in filling holding tank, ≤ 5 µm particle size"],
    reviewFlag: false, stepOrder: 5,
  }).returning();

  const [s70] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "70", operationName: "Filling & Labeling",
    operationType: "operation", machine: "Automated filler FILL-02, checkweigher, vision system",
    description: "Fill GM-spec 1-gal and 55-gal drum formats. Net weight to ± 1.5%. Apply GM DEXOS D OAT label with orange color stripe, batch code, lot#, DEXOS D approval number. Cap torque per format spec.",
    specialChars: ["CC"],
    inputs: ["Filtered coolant", "GM-approved label artwork EVC-LBL-002"],
    outputs: ["Filled, labeled containers"],
    reviewFlag: false, stepOrder: 6,
  }).returning();

  const [s80] = await db.insert(apqpProcessSteps).values({
    apqpProjectId: pid, userId: USER_ID,
    stepNumber: "80", operationName: "Final Inspection & QC Release",
    operationType: "inspection", machine: "Visual station, torque checker, label vision reader",
    description: "AQL Level II 1.0 for label, fill level, cap integrity. Retain sample per retention schedule. Electronic COC generated in LIMS tied to GM purchase order. Stage at GM-dedicated dock.",
    specialChars: ["SC"],
    inputs: ["Filled containers", "Inspection plan QC-IP-OAT-001"],
    outputs: ["Released FG + electronic COC in LIMS; GM shipment documentation"],
    reviewFlag: false, stepOrder: 7,
  }).returning();

  console.log(`  ✓ ${8} process flow steps`);

  // ── PFMEA Rows ────────────────────────────────────────────────────────────
  const [q1] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s10.id, processStep: "10 — RM Receiving",
    processFunction: "Verify OAT inhibitor is phosphate-free and silicate-free per GM DEXOS D",
    failureMode: "Phosphate-containing inhibitor accepted — phosphate contamination in final product",
    failureEffect: "GM DEXOS D specification violation; EV heat exchanger fouling; potential Ultium battery thermal management failure",
    severity: 10, classification: "CC",
    failureCause: "Supplier provides conventional inhibitor instead of OAT inhibitor; mis-labeling of raw material tote",
    preventionControl: "OAT-specific ASL with CoA requirement; ICP-OES test for phosphorus and silica on every lot before QC release",
    occurrence: 2,
    detectionControl: "ICP-OES phosphorus and silica quantification (detection limit 0.1 ppm) before lot release",
    detection: 1, rpn: 20,
    recommendedAction: "Add RFID drum tag to link supplier drum to CoA in IMS; auto-quarantine any lot without RFID scan",
    responsibility: "Elena Vasquez, Quality Manager",
    targetDate: "2026-08-01",
    actionTaken: "",
    resultingSeverity: null, resultingOccurrence: null, resultingDetection: null, resultingRpn: null,
    reviewFlag: false, rowOrder: 0,
  }).returning();

  const [q2] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s20.id, processStep: "20 — DI Water Preparation",
    processFunction: "Produce DI water ≤ 1 µS/cm for use in inhibitor pre-mix",
    failureMode: "High-conductivity water used — chloride or mineral content exceeds spec",
    failureEffect: "Chloride contamination in final coolant exceeds 25 ppm GM limit; aluminum corrosion in EV cooling loop; field failure of coolant passages",
    severity: 9, classification: "KPC",
    failureCause: "RO membrane bypass valve left open after maintenance; conductivity monitor not checked before batch start",
    preventionControl: "Automatic conductivity interlock — pump can only run DI water to production if conductivity reading ≤ 1 µS/cm; daily log required",
    occurrence: 2,
    detectionControl: "Inline conductivity sensor (alarm + interlock); ICP chloride test at QC step 50",
    detection: 2, rpn: 36,
    recommendedAction: "Install secondary conductivity probe as backup; add daily verification to Pre-Production Checklist",
    responsibility: "Marcus Webb, Production Supervisor",
    targetDate: "2026-07-15",
    actionTaken: "Second redundant conductivity probe installed on DI outlet. Pre-production checklist updated. Effective 2026-06-01.",
    resultingSeverity: 9, resultingOccurrence: 2, resultingDetection: 1, resultingRpn: 18,
    reviewFlag: false, rowOrder: 1,
  }).returning();

  const [q3] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s40.id, processStep: "40 — Final Blending",
    processFunction: "Achieve 50:50 EG:water blend ratio within ± 0.5% by weight",
    failureMode: "Off-ratio blend — > ± 0.5% deviation in EG concentration",
    failureEffect: "Freeze point out of spec; coolant fails GM DEXOS D; EV Ultium battery thermal risk in cold climate",
    severity: 9, classification: "CC",
    failureCause: "Coriolis flow meter drift; density variation in EG lot; operator override of automated batching system",
    preventionControl: "Coriolis meters calibrated quarterly (NIST traceable); no manual override without QE approval; automated batching interlock",
    occurrence: 2,
    detectionControl: "Density meter inline (converts to % EG by ASTM D1298); freeze-point check at QC step 50",
    detection: 2, rpn: 36,
    recommendedAction: "Correlate Coriolis data to density meter reading on every batch as double-check; alert if > 1% discrepancy",
    responsibility: "Elena Vasquez, Quality Manager",
    targetDate: "2026-09-01",
    actionTaken: "Density meter cross-check logic programmed into SCADA. Auto-alert generated if variance > 1%. Implemented.",
    resultingSeverity: 9, resultingOccurrence: 1, resultingDetection: 2, resultingRpn: 18,
    reviewFlag: false, rowOrder: 2,
  }).returning();

  const [q4] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s60.id, processStep: "60 — Filtration",
    processFunction: "Remove particles > 5 µm before filling (EV heat exchanger protection)",
    failureMode: "Filter integrity failure — oversized particles pass through to filled product",
    failureEffect: "Particulate contamination in Ultium battery coolant loop; blockage of micro-channel heat exchanger; battery thermal event",
    severity: 9, classification: "SC",
    failureCause: "Filter housing bypass left open; filter bag ruptured (over-pressurized); differential pressure not monitored",
    preventionControl: "Differential pressure gauge with alarm at 10 PSI; mandatory filter change every 10 batches per PM schedule; bypass valve locked/tagged",
    occurrence: 2,
    detectionControl: "Particle count test on QC retain (post-filter sample) per ISO 4406; differential pressure logged per batch",
    detection: 3, rpn: 54,
    recommendedAction: "Add automated particle counter inline after filter; auto-hold filling if count exceeds NAS 6 equivalence",
    responsibility: "Marcus Webb, Production Supervisor",
    targetDate: "2026-10-01",
    actionTaken: "",
    resultingSeverity: null, resultingOccurrence: null, resultingDetection: null, resultingRpn: null,
    reviewFlag: false, rowOrder: 3,
  }).returning();

  const [q5] = await db.insert(apqpPfmeaRows).values({
    apqpProjectId: pid, userId: USER_ID,
    processStepId: s70.id, processStep: "70 — Filling & Labeling",
    processFunction: "Fill to correct net weight; apply GM DEXOS D OAT label with orange color stripe and DEXOS approval number",
    failureMode: "Missing or incorrect DEXOS D approval number on label",
    failureEffect: "GM receiving rejection; lost shipment; CSR non-compliance; potential GM supplier scorecard deduction",
    severity: 8, classification: "CC",
    failureCause: "Label file revision not uploaded to vision system; old label stock used after artwork update",
    preventionControl: "Label ECN workflow triggers automatic vision system template update before next production run; label stock date-coded with sunset policy",
    occurrence: 2,
    detectionControl: "Vision system OCR reads DEXOS approval number on every container; mismatch triggers auto-reject and alarm",
    detection: 1, rpn: 16,
    recommendedAction: "Require QE sign-off on vision template update as part of ECN close-out; add DEXOS number to LIMS COC verification",
    responsibility: "Elena Vasquez, Quality Manager",
    targetDate: "2026-06-30",
    actionTaken: "ECN procedure updated to include vision template sign-off step. DEXOS# added to LIMS COC. Effective immediately.",
    resultingSeverity: 8, resultingOccurrence: 1, resultingDetection: 1, resultingRpn: 8,
    reviewFlag: false, rowOrder: 4,
  }).returning();

  console.log(`  ✓ 5 PFMEA rows`);

  // ── Control Plan Rows ─────────────────────────────────────────────────────
  const cpData2 = [
    {
      pfmeaRowId: q1.id, processStepId: s10.id,
      partProcessNumber: "10", processName: "RM Receiving",
      machineDeviceJig: "ICP-OES (Agilent 5100), Phosphorus & Silica standard solutions",
      charNumber: "C-01", charType: "product" as const, charName: "Phosphorus Concentration (ppm)",
      specialCharClass: "CC", productSpec: "= 0 ppm (non-detect, ≤ 0.1 ppm detection limit) per GM DEXOS D",
      evalMeasureTech: "ICP-OES per ASTM D5185", sampleSize: "100 mL per lot",
      sampleFrequency: "Every incoming inhibitor lot", controlMethod: "LIMS release gate — reject if detected",
      reactionPlan: "Reject lot immediately; quarantine; issue SCAR; notify GM SQE",
    },
    {
      pfmeaRowId: q2.id, processStepId: s20.id,
      partProcessNumber: "20", processName: "DI Water Prep",
      machineDeviceJig: "Inline conductivity meter (dual redundant)",
      charNumber: "C-02", charType: "process" as const, charName: "DI Water Conductivity (µS/cm)",
      specialCharClass: "KPC", productSpec: "≤ 1 µS/cm",
      evalMeasureTech: "Inline conductivity probe, calibrated per ASTM D1125", sampleSize: "Continuous",
      sampleFrequency: "Continuous + logged every 4 hrs", controlMethod: "PLC interlock — pump disabled if conductivity > 1 µS/cm",
      reactionPlan: "Stop production; inspect/replace RO membranes; re-verify before restart",
    },
    {
      pfmeaRowId: q3.id, processStepId: s40.id,
      partProcessNumber: "40", processName: "Final Blending",
      machineDeviceJig: "Coriolis mass flow meter (Endress+Hauser Promass 80) + inline density meter",
      charNumber: "C-03", charType: "product" as const, charName: "EG Blend Ratio (% w/w)",
      specialCharClass: "CC", productSpec: "50.0 ± 0.5% EG by weight per GM DEXOS D ASTM D3306",
      evalMeasureTech: "Coriolis ratio + density meter cross-check (ASTM D1298)", sampleSize: "Continuous per batch",
      sampleFrequency: "Real-time SCADA + sample at batch end", controlMethod: "SCADA automated batching interlock; density cross-check alert if > 1% discrepancy",
      reactionPlan: "Hold batch; re-analyze; adjust and re-blend if within rework SOP range; otherwise reject",
    },
    {
      pfmeaRowId: q3.id, processStepId: s50.id,
      partProcessNumber: "50", processName: "In-Process QC Testing",
      machineDeviceJig: "Propylene/EG freeze point analyzer (ASTM D1177)",
      charNumber: "C-04", charType: "product" as const, charName: "Freeze Point (°C) at 50/50",
      specialCharClass: "CC", productSpec: "≤ −34 °C at 50/50 mix per GM DEXOS D",
      evalMeasureTech: "ASTM D1177 freeze point method", sampleSize: "200 mL per batch",
      sampleFrequency: "Once per batch before filling", controlMethod: "LIMS batch release gate",
      reactionPlan: "Hold batch; investigate blend ratio; reject if confirmed OOS; issue CAPA",
    },
    {
      pfmeaRowId: q1.id, processStepId: s50.id,
      partProcessNumber: "50", processName: "In-Process QC Testing",
      machineDeviceJig: "ICP-OES, Chloride ion chromatograph",
      charNumber: "C-05", charType: "product" as const, charName: "Chloride Content (ppm)",
      specialCharClass: "SC", productSpec: "≤ 25 ppm per GM DEXOS D",
      evalMeasureTech: "Ion chromatography per ASTM D512 / ICP-OES", sampleSize: "100 mL per batch",
      sampleFrequency: "Once per batch", controlMethod: "LIMS batch release gate",
      reactionPlan: "Investigate DI water and inhibitor source; hold and reject if > 25 ppm",
    },
    {
      pfmeaRowId: q4.id, processStepId: s60.id,
      partProcessNumber: "60", processName: "Filtration",
      machineDeviceJig: "Differential pressure gauge, 5-micron filter housing",
      charNumber: "C-06", charType: "process" as const, charName: "Filter Differential Pressure (PSI)",
      specialCharClass: "SC", productSpec: "≤ 10 PSI (change filter if exceeded)",
      evalMeasureTech: "Analog differential pressure gauge, read and logged each batch", sampleSize: "Per batch",
      sampleFrequency: "Continuous — logged at start, mid, end of batch", controlMethod: "Visual check + alarm; mandatory filter change at 10 PSI or every 10 batches",
      reactionPlan: "Stop transfer; replace filter bag; re-start; quarantine product produced during high-dP event",
    },
    {
      pfmeaRowId: q5.id, processStepId: s70.id,
      partProcessNumber: "70", processName: "Filling & Labeling",
      machineDeviceJig: "Cognex vision system + label template EVC-LBL-002",
      charNumber: "C-07", charType: "product" as const, charName: "DEXOS D Approval Number on Label",
      specialCharClass: "CC", productSpec: "Must match current DEXOS D approval number (GM-6277M) — zero tolerance",
      evalMeasureTech: "Vision system OCR — reads approval number on every container", sampleSize: "100%",
      sampleFrequency: "Every container", controlMethod: "Auto-reject gate on mismatch; LIMS COC verification",
      reactionPlan: "Stop line; quarantine; update vision template; notify GM QE; do not re-ship without GM concession",
    },
    {
      pfmeaRowId: q5.id, processStepId: s70.id,
      partProcessNumber: "70", processName: "Filling & Labeling",
      machineDeviceJig: "In-line checkweigher (± 1 g accuracy)",
      charNumber: "C-08", charType: "product" as const, charName: "Net Fill Weight — 1-gal jug (lbs)",
      specialCharClass: "", productSpec: "9.08 lbs ± 1.5% (8.94 – 9.22 lbs) per GM packaging spec EVC-PACK-GM26",
      evalMeasureTech: "100% in-line checkweigher; calibrated per shift with NIST weights", sampleSize: "100%",
      sampleFrequency: "Every container", controlMethod: "Auto-reject gate; SPC X-bar/R chart every 30 min",
      reactionPlan: "Stop filler; inspect nozzles; re-zero checkweigher; quarantine last 20 units",
    },
  ];

  const cpRows2: Array<{ id: number }> = [];
  for (let i = 0; i < cpData2.length; i++) {
    const [r] = await db.insert(apqpControlPlanRows).values({
      apqpProjectId: pid, userId: USER_ID,
      ...cpData2[i],
      reviewFlag: false, rowOrder: i,
    }).returning();
    cpRows2.push(r);
  }
  console.log(`  ✓ ${cpRows2.length} control plan rows`);

  // ── Inspection Sheet ──────────────────────────────────────────────────────
  const [sheet2] = await db.insert(apqpInspectionSheets).values({
    apqpProjectId: pid, userId: USER_ID,
    sheetTitle: "Pre-Launch Production Validation — OAT Coolant Lot EVC-2026-0305",
    partNumber: "EVC-OAT5050-GM26",
    partName: "OAT Coolant 50/50 — GM Ultium EV Program",
    inspector: "Marcus Webb",
    inspectionDate: "2026-03-05",
    lotNumber: "EVC-2026-0305",
    quantity: "240 jugs (20 cases)",
    status: "conditional",
    notes: "Freeze point borderline at −34.1°C (spec: ≤ −34 °C). Accepted under conditional concession GM-CONC-2026-011 pending blend ratio investigation. CAPA #CV-CAPA-0302 open.",
  }).returning();

  const inspRows2 = [
    { charName: "Phosphorus Concentration (ppm)", specification: "= 0 ppm (ND)", measureTech: "ICP-OES ASTM D5185", sampleSize: "100 mL / lot", measurements: [{ value: "< 0.1 ppm (ND)", status: "pass" as const }], status: "pass" as const, notes: "" },
    { charName: "DI Water Conductivity (µS/cm)", specification: "≤ 1 µS/cm", measureTech: "Inline conductivity probe", sampleSize: "Continuous", measurements: [{ value: "0.6 µS/cm", status: "pass" as const }], status: "pass" as const, notes: "" },
    { charName: "EG Blend Ratio (% w/w)", specification: "50.0 ± 0.5%", measureTech: "Coriolis + density cross-check", sampleSize: "Batch end sample", measurements: [{ value: "49.6% EG", status: "pass" as const }], status: "pass" as const, notes: "Within tolerance at 49.6%" },
    { charName: "Freeze Point (°C) at 50/50", specification: "≤ −34 °C", measureTech: "ASTM D1177", sampleSize: "200 mL", measurements: [{ value: "−34.1°C", status: "pass" as const }], status: "pass" as const, notes: "Borderline — concession GM-CONC-2026-011 issued. CAPA open." },
    { charName: "Chloride Content (ppm)", specification: "≤ 25 ppm", measureTech: "Ion chromatography ASTM D512", sampleSize: "100 mL", measurements: [{ value: "8.2 ppm", status: "pass" as const }], status: "pass" as const, notes: "" },
    { charName: "Filter Differential Pressure (PSI)", specification: "≤ 10 PSI", measureTech: "Differential pressure gauge", sampleSize: "Per batch", measurements: [{ value: "3.2 PSI start", status: "pass" as const }, { value: "4.8 PSI end", status: "pass" as const }], status: "pass" as const, notes: "" },
    { charName: "DEXOS D Approval Number on Label", specification: "GM-6277M — zero tolerance", measureTech: "Vision OCR, 100%", sampleSize: "100%", measurements: [{ value: "PASS — GM-6277M confirmed all 240", status: "pass" as const }], status: "pass" as const, notes: "" },
    { charName: "Net Fill Weight — 1-gal (lbs)", specification: "9.08 ± 1.5% lbs", measureTech: "Checkweigher 100%", sampleSize: "100%", measurements: [{ value: "9.10 lbs", status: "pass" as const }, { value: "9.07 lbs", status: "pass" as const }, { value: "9.12 lbs", status: "pass" as const }], status: "pass" as const, notes: "" },
  ];

  for (let i = 0; i < inspRows2.length; i++) {
    const cp = cpRows2[i];
    await db.insert(apqpInspectionRows).values({
      inspectionSheetId: sheet2.id,
      controlPlanRowId: cp?.id ?? null,
      userId: USER_ID,
      ...inspRows2[i],
      rowOrder: i,
    });
  }
  console.log(`  ✓ Inspection sheet with ${inspRows2.length} rows (conditional — open CAPA)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  APQP Documentation Suite Seed — CCI Chemical, Inc.             ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");

  console.log("\nClearing existing doc suite data...");
  await clearProject(1);
  await clearProject(2);

  await seedProject1();
  await seedProject2();

  console.log("\n✅  Seed complete!");
  console.log("   Project 1 (Ford DOT 4+): 8 PFD steps, 5 PFMEA rows, 8 CP rows, 1 inspection sheet (PASS)");
  console.log("   Project 2 (GM OAT Coolant): 8 PFD steps, 5 PFMEA rows, 8 CP rows, 1 inspection sheet (CONDITIONAL)");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
