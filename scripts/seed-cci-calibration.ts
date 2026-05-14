/**
 * Seed script: CCI Chemical, Inc. — Calibration Module sample data
 * Run: npx tsx scripts/seed-cci-calibration.ts
 *
 * CCI Chemical is a brake fluid (DOT 3/4/5.1) and coolant (EG/PG-based)
 * manufacturer in Dayton, OH, certified to IATF 16949.
 *
 * Covers IATF 16949 7.1.5 (Monitoring & Measurement Resources)
 * and 7.1.5.3 (MSA / Out-of-Tolerance) requirements.
 *
 * Project ID : 4   (CCI Chemical IATF 16949 QMS)
 * User ID    : 54320068  (Ebeni Villarreal)
 */

import { db } from "../server/db";
import {
  calibrationEquipment,
  calibrationRecords,
  calibrationOotAssessments,
  calibrationLabScope,
  isoDocuments,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

const CAL_WI_TITLE = "WI-CAL-003 Conductivity Meter Inline Calibration Procedure";

const CAL_WI_CONTENT = `# WI-CAL-003 Conductivity Meter Inline Calibration Procedure

**Revision:** A  |  **Effective Date:** 2025-01-15  |  **Approved By:** Ebeni Villarreal, Quality Engineer

---

## 1. Purpose
This work instruction defines the two-point in-house calibration procedure for the CCI Chemical inline conductivity meter (CCI-GAG-005). It establishes the method for verifying instrument accuracy across the process range using NIST-traceable reference standards.

## 2. Scope
Applies to: CCI-GAG-005 — Conductivity Meter — Inline (Manufacturer: Hach, Model CM10). Calibration is performed every 6 months or after any repair/adjustment.

## 3. References
- NIST SRM 3190 (Conductivity Standard, 1413 µS/cm)
- NIST SRM 917d (KCl Solution, 84 µS/cm)
- ISO 10012:2003 — Measurement management systems
- IATF 16949:2016 7.1.5 — Monitoring and measuring resources
- ASTM D5391 — Conductivity of Water Measurement

## 4. Responsibility
The Quality Engineer or designated QC Technician with documented training on WI-CAL-003 shall perform this calibration.

## 5. Required Equipment & Reference Standards
| Item | Description | ID No. | Cal Cert No. | Traceable To |
|------|-------------|--------|-------------|---------------|
| Ref Std 1 | NIST SRM 3190 — Conductivity Std, 1413 µS/cm | NIST-STD-001 | NIST-3190-2024-889 | NIST |
| Ref Std 2 | NIST SRM 917d — KCl Std, 84 µS/cm | NIST-STD-002 | NIST-917D-2024-445 | NIST |
| Thermometer | ASTM 12C Reference Thermometer | CCI-GAG-006 | See GAG-006 Cal Record | NIST |
| DI Water | Conductivity < 1 µS/cm (verified) | N/A | N/A | Internal |

## 6. Safety Precautions
- Wear appropriate PPE (lab coat, nitrile gloves, safety glasses) when handling reference solutions.
- Reference standards are not hazardous but must be handled to prevent contamination.
- Dispose of used reference solutions per SOP-EHS-003.

## 7. Environmental Conditions
Calibration shall be performed in the QC Laboratory under the following conditions:
- **Temperature:** 20°C ± 1°C (68°F ± 2°F)
- **Humidity:** 40–60% RH
- **Condition verification:** Record temperature and humidity from calibrated QC Lab environmental monitor at time of calibration.

## 8. Calibration Procedure — Two-Point Method

### Step 1 — Pre-Calibration Checks (Required)
□ Perform visual inspection of electrode, probe tip, and cable connections. No corrosion, cracks, or physical damage.
□ Verify electrode is clean and free of process residue. Rinse with DI water. Blot dry with lint-free tissue (do not wipe).
□ Verify zero/DI water check: immerse probe in DI water (< 1 µS/cm). Reading must be < 2 µS/cm.
□ Verify instrument zero offset is within acceptable limits.

### Step 2 — Low-Point Calibration (84 µS/cm)
1. Pour NIST SRM 917d into a clean beaker. Verify solution temperature is 20°C ± 1°C.
2. Immerse probe completely — electrode must be fully submerged; no air bubbles.
3. Allow reading to stabilize (typically 30–60 sec).
4. Record Trial 1 reading. Remove probe, rinse with DI water, blot dry. Re-immerse in fresh aliquot. Record Trials 2 and 3.
5. Calculate average. Acceptance: within ±1.5% of 84 µS/cm (82.74–85.26 µS/cm).

### Step 3 — High-Point Calibration (1413 µS/cm)
1. Rinse probe 3× with DI water. Blot dry.
2. Pour NIST SRM 3190 into a clean beaker. Verify temperature is 20°C ± 1°C.
3. Immerse probe — electrode fully submerged. Allow reading to stabilize.
4. Record Trials 1, 2, 3.
5. Calculate average. Acceptance: within ±1.5% of 1413 µS/cm (1391.81–1434.20 µS/cm).

### Step 4 — Instrument Adjustment (if needed)
If either calibration point fails acceptance criteria, perform instrument cell constant adjustment per manufacturer procedure and repeat. If instrument fails again, remove from service and open CAR per QP-004-1.

### Step 5 — Temperature Compensation Verification
Verify instrument TC is active and set to linear mode (2.0%/°C). Record bath temperature using CCI-GAG-006. Confirm readout is compensated to 25°C reference.

## 9. Acceptance Criteria
| Point | Nominal | Tolerance | Min | Max |
|-------|---------|-----------|-----|-----|
| Low | 84 µS/cm | ±1.5% | 82.74 µS/cm | 85.26 µS/cm |
| High | 1413 µS/cm | ±1.5% | 1391.81 µS/cm | 1434.20 µS/cm |

## 10. Calibration Record Completion
Complete Calibration Record CCI-GAG-005 in the CCHUB Calibration Module. Issue internal certificate number: INT-COND-[YEAR]-[NNN]. Update next due date (6 months). Apply calibration sticker: GAG ID, Cal Date, Next Due, Performed By.

## 11. Document Control
| Rev | Date | Description | Author |
|-----|------|-------------|--------|
| A | 2025-01-15 | Initial release | E. Villarreal |
`;

async function ensureCalibrationWI(): Promise<number> {
  const existing = await db
    .select({ id: isoDocuments.id })
    .from(isoDocuments)
    .where(eq(isoDocuments.title, CAL_WI_TITLE))
    .limit(1);
  if (existing.length > 0) {
    console.log(`    ✓ WI already exists (ID ${existing[0].id}) — reusing`);
    return existing[0].id;
  }
  const [doc] = await db
    .insert(isoDocuments)
    .values({
      userId: USER_ID,
      isoProjectId: PROJECT_ID,
      docType: "work_instruction",
      title: CAL_WI_TITLE,
      content: CAL_WI_CONTENT,
      isoClause: "7.1.5",
      status: "approved",
      version: "A",
      approvedBy: "Ebeni Villarreal",
      approvalDate: "2025-01-15",
      reviewDate: "2026-01-15",
      tags: ["calibration", "conductivity", "internal-calibration", "measurement"],
    })
    .returning({ id: isoDocuments.id });
  console.log(`    ✓ Created WI-CAL-003 (ID ${doc.id})`);
  return doc.id;
}

const PROJECT_ID = 4;
const USER_ID = "54320068";

// ─── Date helpers ────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Clear existing data ─────────────────────────────────────────────────────

async function clearExisting() {
  const existing = await db
    .select({ id: calibrationEquipment.id })
    .from(calibrationEquipment)
    .where(
      and(
        eq(calibrationEquipment.userId, USER_ID),
        eq(calibrationEquipment.isoProjectId, PROJECT_ID)
      )
    );

  if (existing.length === 0) {
    console.log("  No existing calibration data — fresh seed.\n");
    return;
  }

  console.log(`  Clearing ${existing.length} existing gage(s)…`);
  const ids = existing.map((r) => r.id);

  for (const id of ids) {
    const recs = await db
      .select({ id: calibrationRecords.id })
      .from(calibrationRecords)
      .where(eq(calibrationRecords.equipmentId, id));

    for (const rec of recs) {
      await db
        .delete(calibrationOotAssessments)
        .where(eq(calibrationOotAssessments.calibrationRecordId, rec.id));
    }
    await db
      .delete(calibrationRecords)
      .where(eq(calibrationRecords.equipmentId, id));
  }

  await db
    .delete(calibrationEquipment)
    .where(
      and(
        eq(calibrationEquipment.userId, USER_ID),
        eq(calibrationEquipment.isoProjectId, PROJECT_ID)
      )
    );

  console.log("  Cleared.\n");
}

// ─── Equipment seeds ─────────────────────────────────────────────────────────

const EQUIPMENT_SEEDS = [
  // ── Laboratory / QC instruments ─────────────────────────────────────────
  {
    gageId: "CCI-GAG-001",
    name: "pH Meter — Lab Primary",
    type: "pH Meter",
    manufacturer: "Mettler-Toledo",
    model: "FiveEasy Plus FE28",
    serialNumber: "MT-224891-A",
    location: "QC Lab, Bench 1",
    responsiblePerson: "Ebeni Villarreal",
    responsibleEmail: "evillarreal@acsi-quality.com",
    measurementRange: "0–14 pH",
    resolution: "0.01 pH",
    tolerance: "±0.05 pH",
    calFrequencyMonths: 6,
    calType: "internal" as const,
    calibrationLab: "CCI Internal QC Lab",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(12),   // Due soon — triggers reminder
    notes: "Two-point buffer calibration at pH 4.00 and 7.00. Critical for DOT 3/4 fluid pH spec.",
  },
  {
    gageId: "CCI-GAG-002",
    name: "Analytical Balance — 220g",
    type: "Analytical Balance",
    manufacturer: "Sartorius",
    model: "Quintix 224-1S",
    serialNumber: "SR-76441-2024",
    location: "QC Lab, Bench 2",
    responsiblePerson: "Ebeni Villarreal",
    responsibleEmail: "evillarreal@acsi-quality.com",
    measurementRange: "0–220 g",
    resolution: "0.0001 g",
    tolerance: "±0.0002 g",
    calFrequencyMonths: 12,
    calType: "external" as const,
    calibrationLab: "Trescal, Inc. — Cincinnati, OH",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(47),
    notes: "Used for raw material sample weighing, density determination, and QC formulation checks.",
  },
  {
    gageId: "CCI-GAG-003",
    name: "Kinematic Viscometer — Bath Unit",
    type: "Viscometer",
    manufacturer: "Cannon Instrument",
    model: "CAV-4 Automatic",
    serialNumber: "CAV-10038",
    location: "QC Lab, Bench 3",
    responsiblePerson: "Marcus Webb",
    responsibleEmail: "mwebb@ccichemical.com",
    measurementRange: "0.5–20,000 cSt",
    resolution: "0.01 cSt",
    tolerance: "±0.5%",
    calFrequencyMonths: 12,
    calType: "external" as const,
    calibrationLab: "Cannon Instrument Calibration Services",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(-8),   // OVERDUE
    notes: "ASTM D445 viscosity testing for coolant and brake fluid. Calibrated with S3 & S6 viscosity reference standards.",
  },
  {
    gageId: "CCI-GAG-004",
    name: "Refractometer — Coolant Concentration",
    type: "Refractometer",
    manufacturer: "ATAGO",
    model: "PAL-91S",
    serialNumber: "AT-29831",
    location: "Production Floor — Station 4",
    responsiblePerson: "Marcus Webb",
    responsibleEmail: "mwebb@ccichemical.com",
    measurementRange: "0–50% EG",
    resolution: "0.2%",
    tolerance: "±0.5%",
    calFrequencyMonths: 6,
    calType: "internal" as const,
    calibrationLab: "CCI Internal QC Lab",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(22),
    notes: "Used for in-process ethylene glycol concentration checks. Calibrated against NIST-traceable DI water and 30% EG reference solution.",
  },
  {
    gageId: "CCI-GAG-005",
    name: "Conductivity Meter — Inline",
    type: "Conductivity Meter",
    manufacturer: "Hach",
    model: "HQ40d Multi",
    serialNumber: "HQ-882341",
    location: "Blending Tank Line B",
    responsiblePerson: "Latasha Monroe",
    responsibleEmail: "lmonroe@ccichemical.com",
    measurementRange: "0.01–200 mS/cm",
    resolution: "0.001 mS/cm",
    tolerance: "±1.5%",
    calFrequencyMonths: 6,
    calType: "internal" as const,
    calibrationLab: "CCI Internal QC Lab",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(5),    // Due in 5 days — triggers reminder
    notes: "Monitors deionized water purity and inhibitor concentration in coolant blending.",
  },
  {
    gageId: "CCI-GAG-006",
    name: "Precision Thermometer — ASTM 12C",
    type: "Thermometer",
    manufacturer: "WIKA",
    model: "CTR3000",
    serialNumber: "WK-331095",
    location: "QC Lab — Freezing Point Bath",
    responsiblePerson: "Ebeni Villarreal",
    responsibleEmail: "evillarreal@acsi-quality.com",
    measurementRange: "-100°C to 50°C",
    resolution: "0.01°C",
    tolerance: "±0.05°C",
    calFrequencyMonths: 12,
    calType: "external" as const,
    calibrationLab: "Trescal, Inc. — Cincinnati, OH",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(95),
    notes: "Used for ASTM D1177 freezing point determination of brake fluid and coolant per customer specs.",
  },
  {
    gageId: "CCI-GAG-007",
    name: "Pressure Gauge — Filling Line",
    type: "Pressure Gauge",
    manufacturer: "Ashcroft",
    model: "1279SS-02L-XCC",
    serialNumber: "ASH-770432",
    location: "Filling Line 1 — Manifold",
    responsiblePerson: "Latasha Monroe",
    responsibleEmail: "lmonroe@ccichemical.com",
    measurementRange: "0–100 PSI",
    resolution: "1 PSI",
    tolerance: "±2%",
    calFrequencyMonths: 12,
    calType: "external" as const,
    calibrationLab: "Ashcroft Calibration Services",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(182),
    notes: "Monitors line pressure during bottle/container filling. Critical for preventing overpressure events.",
  },
  {
    gageId: "CCI-GAG-008",
    name: "Coriolis Mass Flow Meter",
    type: "Flow Meter",
    manufacturer: "Endress+Hauser",
    model: "Promass F 100",
    serialNumber: "EH-104.00-CN",
    location: "Blending Tank Line A — Inline",
    responsiblePerson: "Latasha Monroe",
    responsibleEmail: "lmonroe@ccichemical.com",
    measurementRange: "0–5,000 kg/hr",
    resolution: "0.1 kg/hr",
    tolerance: "±0.1%",
    calFrequencyMonths: 24,
    calType: "external" as const,
    calibrationLab: "Endress+Hauser Calibration Services",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(312),
    notes: "Primary mass flow measurement for batch accuracy in coolant blending. OEM factory calibration certificate required.",
  },
  {
    gageId: "CCI-GAG-009",
    name: "Torque Wrench — Container Closure",
    type: "Torque Wrench",
    manufacturer: "Snap-on",
    model: "QJFR200",
    serialNumber: "SN-88421-D",
    location: "Packaging Line 2",
    responsiblePerson: "Marcus Webb",
    responsibleEmail: "mwebb@ccichemical.com",
    measurementRange: "40–200 ft-lb",
    resolution: "1 ft-lb",
    tolerance: "±4%",
    calFrequencyMonths: 6,
    calType: "external" as const,
    calibrationLab: "Trescal, Inc. — Cincinnati, OH",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(-22),  // OVERDUE
    notes: "Used for torquing UN-rated packaging closures. Customer (GM, Stellantis) requires cal cert on file per AIAG packaging standard.",
  },
  {
    gageId: "CCI-GAG-010",
    name: "Hydrometer Set — Specific Gravity",
    type: "Hydrometer",
    manufacturer: "Fisher Scientific",
    model: "ASTM 67H / 68H / 69H",
    serialNumber: "FS-SG-SET-003",
    location: "QC Lab, Cabinet A",
    responsiblePerson: "Ebeni Villarreal",
    responsibleEmail: "evillarreal@acsi-quality.com",
    measurementRange: "0.700–1.000 g/mL (set)",
    resolution: "0.001 g/mL",
    tolerance: "±0.001 g/mL",
    calFrequencyMonths: 12,
    calType: "external" as const,
    calibrationLab: "Precision Calibration Services — Dayton, OH",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(28),   // Due in 28 days — within 30-day reminder window
    notes: "ASTM specification hydrometers for brake fluid and coolant specific gravity determination per DOT FMVSS 116.",
  },
  {
    gageId: "CCI-GAG-011",
    name: "Boiling Point Tester (ERPBP)",
    type: "Test Apparatus",
    manufacturer: "Phoenix Systems",
    model: "BrakeStrip DOT-3 ERPBP",
    serialNumber: "PS-BPTEST-2021-07",
    location: "QC Lab, Bench 4",
    responsiblePerson: "Marcus Webb",
    responsibleEmail: "mwebb@ccichemical.com",
    measurementRange: "150°C–280°C",
    resolution: "1°C",
    tolerance: "±3°C",
    calFrequencyMonths: 12,
    calType: "external" as const,
    calibrationLab: "Precision Calibration Services — Dayton, OH",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(154),
    notes: "ERPBP (Equilibrium Reflux Boiling Point) per FMVSS 116 / SAE J1703. Critical product-release gate test.",
  },
  {
    gageId: "CCI-GAG-012",
    name: "Digital Caliper — Receiving Inspection",
    type: "Caliper",
    manufacturer: "Mitutoyo",
    model: "CD-8\" AX",
    serialNumber: "MIT-20198847",
    location: "Receiving Dock, Inspection Station",
    responsiblePerson: "Latasha Monroe",
    responsibleEmail: "lmonroe@ccichemical.com",
    measurementRange: "0–200 mm",
    resolution: "0.01 mm",
    tolerance: "±0.02 mm",
    calFrequencyMonths: 12,
    calType: "internal" as const,
    calibrationLab: "CCI Internal QC Lab",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(67),
    notes: "Used for receiving inspection of container dimensions, closure ODs, and incoming packaging verification.",
  },
  {
    gageId: "CCI-GAG-013",
    name: "Customer-Supplied pH Reference Meter",
    type: "pH Meter",
    manufacturer: "YSI",
    model: "Pro10",
    serialNumber: "YSI-GM-CS-001",
    location: "QC Lab, Locked Cabinet",
    responsiblePerson: "Ebeni Villarreal",
    responsibleEmail: "evillarreal@acsi-quality.com",
    measurementRange: "0–14 pH",
    resolution: "0.01 pH",
    tolerance: "±0.02 pH",
    calFrequencyMonths: 6,
    calType: "external" as const,
    calibrationLab: "GM Supplier Quality Engineering — Customer Directed",
    traceableStandard: "NIST",
    customerOwned: true,
    status: "active" as const,
    nextDueDate: daysFromNow(18),
    notes: "Customer-owned (GM / Stellantis). Calibration arranged and funded by customer. Store per GM WM-001A handling requirements.",
  },
  {
    gageId: "CCI-GAG-014",
    name: "Turbidity Meter — Effluent Monitoring",
    type: "Turbidity Meter",
    manufacturer: "HACH",
    model: "2100Q Portable",
    serialNumber: "HC-TRB-4492",
    location: "Environmental — Effluent Pit",
    responsiblePerson: "Latasha Monroe",
    responsibleEmail: "lmonroe@ccichemical.com",
    measurementRange: "0–1000 NTU",
    resolution: "0.01 NTU",
    tolerance: "±2 NTU",
    calFrequencyMonths: 6,
    calType: "internal" as const,
    calibrationLab: "CCI Internal Environmental Lab",
    traceableStandard: "EPA Method 180.1",
    customerOwned: false,
    status: "active" as const,
    nextDueDate: daysFromNow(9),    // Due within reminder window
    notes: "Supports OEPA wastewater monitoring permit compliance. Secondary requirement under Environmental Compliance module.",
  },
  {
    gageId: "CCI-GAG-015",
    name: "Temperature Datalogger — Cold Storage",
    type: "Temperature Datalogger",
    manufacturer: "Onset HOBO",
    model: "UX100-011A",
    serialNumber: "HOB-CS-DL-2022-02",
    location: "Cold Storage Room B (raw materials)",
    responsiblePerson: "Marcus Webb",
    responsibleEmail: "mwebb@ccichemical.com",
    measurementRange: "-20°C to 70°C",
    resolution: "0.02°C",
    tolerance: "±0.25°C",
    calFrequencyMonths: 12,
    calType: "external" as const,
    calibrationLab: "Trescal, Inc. — Cincinnati, OH",
    traceableStandard: "NIST",
    customerOwned: false,
    status: "out_of_service" as const,
    nextDueDate: null,
    notes: "Currently out of service — battery replacement and recalibration pending. Do not use for controlled storage monitoring until cal cert is renewed.",
  },
];

// ─── Calibration record history per gage ─────────────────────────────────────
// Returns [{ equipmentIndex, records[] }]

function buildRecords(equipIds: number[]): Array<{
  equipmentId: number;
  records: Array<{
    calibrationDate: string;
    performedBy: string;
    certNumber: string;
    standardsReferenced: string[];
    result: "pass" | "fail" | "conditional";
    outOfTolerance: boolean;
    adjustmentsMade?: string;
    nextDueDate: string;
    notes?: string;
    oot?: {
      affectedProducts: string;
      suspectDateStart: string;
      suspectDateEnd: string;
      disposition: string;
      riskLevel: string;
      containmentActions: string;
      correctiveActionRef: string;
      assessedBy: string;
      assessmentDate: string;
      notes: string;
    };
  }>;
}> {
  return [
    // GAG-001 pH Meter — 2 past cals (most recent passed, next due soon)
    {
      equipmentId: equipIds[0],
      records: [
        {
          calType: "internal" as const,
          calibrationDate: daysFromNow(-372),
          performedBy: "Ebeni Villarreal",
          certNumber: "INT-PH-2023-001",
          standardsReferenced: ["NIST SRM 185h (pH 4.00)", "NIST SRM 186i (pH 7.00)"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(-6),
          notes: "Two-point buffer calibration. Slope 99.2% — within spec.",
        },
        {
          calType: "internal" as const,
          calibrationDate: daysFromNow(-6),
          performedBy: "Ebeni Villarreal",
          certNumber: "INT-PH-2024-001",
          standardsReferenced: ["NIST SRM 185h (pH 4.00)", "NIST SRM 186i (pH 7.00)"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(12),
          notes: "Slope 98.7%. Zero offset ±0.01 pH. All within acceptance criteria.",
        },
      ],
    },

    // GAG-002 Analytical Balance — 1 past cal
    {
      equipmentId: equipIds[1],
      records: [
        {
          calibrationDate: daysFromNow(-318),
          performedBy: "Trescal, Inc.",
          certNumber: "TRC-2024-BAL-9342",
          standardsReferenced: ["ASTM E617 Class 2", "OIML R111 Class E2"],
          result: "pass",
          outOfTolerance: false,
          adjustmentsMade: "Span adjusted +0.0002 g at 200g.",
          nextDueDate: daysFromNow(47),
          notes: "Linearity verified at 50g, 100g, 200g. Corner load deviation <0.0003g. Certificate on file.",
        },
      ],
    },

    // GAG-003 Viscometer — OVERDUE. Last cal was OOT (fail) — includes OOT assessment
    {
      equipmentId: equipIds[2],
      records: [
        {
          calibrationDate: daysFromNow(-738),
          performedBy: "Cannon Instrument Cal Services",
          certNumber: "CANNON-2022-VIS-1188",
          standardsReferenced: ["ASTM D2162", "ASTM D445"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(-376),
          notes: "Verified with S3 standard (3.125 cSt). Tube constants within 0.1%. Passed.",
        },
        {
          calibrationDate: daysFromNow(-376),
          performedBy: "Cannon Instrument Cal Services",
          certNumber: "CANNON-2023-VIS-2047",
          standardsReferenced: ["ASTM D2162", "ASTM D445"],
          result: "fail",
          outOfTolerance: true,
          adjustmentsMade: "Temperature bath thermocouple replaced. Unit returned to service after corrective maintenance.",
          nextDueDate: daysFromNow(-8),
          notes: "Bath temperature drift detected. S6 standard error exceeded ±1.2% tolerance. OOT assessment completed. Corrective maintenance performed before return to service.",
          oot: {
            affectedProducts: "DOT 4 Brake Fluid Lot BF-2023-088, Coolant Lot EC-2023-112 (produced during suspect period)",
            suspectDateStart: daysFromNow(-390),
            suspectDateEnd: daysFromNow(-376),
            disposition: "rework",
            riskLevel: "high",
            containmentActions: "Affected lots quarantined. Re-tested using calibrated backup viscometer. 3 of 12 sub-lots failed re-test and were reprocessed. 9 sub-lots confirmed conforming on retest.",
            correctiveActionRef: "CAR-2023-017",
            assessedBy: "Ebeni Villarreal",
            assessmentDate: daysFromNow(-374),
            notes: "Root cause: thermocouple drift due to chemical contamination on probe junction. CAPA initiated. Corrective action: weekly visual inspection of bath thermocouple and quarterly confirmation check against reference thermometer added to PM schedule.",
          },
        },
        {
          calibrationDate: daysFromNow(-8),
          performedBy: "Cannon Instrument Cal Services",
          certNumber: "CANNON-2024-VIS-3301",
          standardsReferenced: ["ASTM D2162", "ASTM D445"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(-8 + 365),
          notes: "Post-repair calibration following thermocouple replacement. All points within ±0.35%. Tube constants verified. Returned to active service.",
        },
      ],
    },

    // GAG-004 Refractometer — 1 past cal, due in 22 days
    {
      equipmentId: equipIds[3],
      records: [
        {
          calType: "internal" as const,
          calibrationDate: daysFromNow(-162),
          performedBy: "Ebeni Villarreal",
          certNumber: "INT-RF-2024-003",
          standardsReferenced: ["NIST SRM 1937a (sucrose solution)"],
          result: "pass",
          outOfTolerance: false,
          adjustmentsMade: "Zero reset with DI water. Span confirmed with 30% EG reference.",
          nextDueDate: daysFromNow(22),
          notes: "Calibrated at 0% and 30% EG. Reading within ±0.2%. Passed.",
        },
      ],
    },

    // GAG-005 Conductivity — fully completed internal calibration example, due in 5 days
    {
      equipmentId: equipIds[4],
      records: [
        {
          calType: "internal" as const,
          calibrationDate: daysFromNow(-175),
          performedBy: "Ebeni Villarreal",
          certNumber: "INT-COND-2024-002",
          standardsReferenced: [
            "NIST SRM 917d (KCl solution, 84 µS/cm)",
            "NIST SRM 3190 (conductivity standard, 1413 µS/cm)",
          ],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(5),
          environmentConditions: "Temp: 20°C, Humidity: 48%, Climate-controlled QC Lab",
          measurementUncertainty: "±0.5 µS/cm (k=2, 95% confidence)",
          asFoundReading: "Low 84 µS/cm avg 83.93 µS/cm; High 1413 µS/cm avg 1410.57 µS/cm",
          asLeftReading: "No adjustment required — both points within ±1.5% tolerance",
          adjustmentsMade: "None. Both calibration points passed acceptance criteria on first attempt.",
          preCalibrationChecks: {
            visualInspectionPass: true,
            zeroCheckPass: true,
            equipmentClean: true,
            notes: "Probe tip rinsed 3× DI water, blotted dry. DI water check: 0.8 µS/cm — within limit. Zero offset normal.",
          },
          referenceStandards: [
            {
              id: "ref-std-cond-1",
              description: "NIST SRM 917d — Potassium Chloride Standard, 84 µS/cm",
              identification: "NIST-STD-002",
              certNumber: "NIST-917D-2024-445",
              certDueDate: "2026-03-31",
              traceability: "NIST",
            },
            {
              id: "ref-std-cond-2",
              description: "NIST SRM 3190 — Conductivity Standard, 1413 µS/cm",
              identification: "NIST-STD-001",
              certNumber: "NIST-3190-2024-889",
              certDueDate: "2026-10-31",
              traceability: "NIST",
            },
          ],
          measurementData: [
            {
              id: "meas-cond-1",
              nominalValue: "84",
              unit: "µS/cm",
              trial1: "83.9",
              trial2: "84.1",
              trial3: "83.8",
              withinTolerance: true,
              notes: "Low-point: NIST SRM 917d. Acceptance 82.74–85.26 µS/cm. Avg: 83.93",
            },
            {
              id: "meas-cond-2",
              nominalValue: "1413",
              unit: "µS/cm",
              trial1: "1409.2",
              trial2: "1411.7",
              trial3: "1410.8",
              withinTolerance: true,
              notes: "High-point: NIST SRM 3190. Acceptance 1391.81–1434.20 µS/cm. Avg: 1410.57",
            },
          ],
          notes: "Two-point calibration per WI-CAL-003. Low point (84 µS/cm): avg 83.93 µS/cm (error −0.08%). High point (1413 µS/cm): avg 1410.57 µS/cm (error −0.17%). Cell constant K=1.0001 verified. TC active at 2.0%/°C linear, compensated to 25°C reference. Approved for continued service.",
        },
      ],
    },

    // GAG-006 Thermometer — recent external cal
    {
      equipmentId: equipIds[5],
      records: [
        {
          calibrationDate: daysFromNow(-270),
          performedBy: "Trescal, Inc.",
          certNumber: "TRC-2023-TEMP-7741",
          standardsReferenced: ["ITS-90", "ASTM E1 Thermometry"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(95),
          notes: "Multi-point calibration: -40°C, 0°C, 25°C, 50°C. Max deviation ±0.03°C. Certificate on file.",
        },
      ],
    },

    // GAG-007 Pressure Gauge — recent external cal
    {
      equipmentId: equipIds[6],
      records: [
        {
          calibrationDate: daysFromNow(-183),
          performedBy: "Ashcroft Calibration Services",
          certNumber: "ASH-CAL-2024-0832",
          standardsReferenced: ["ASME B40.100", "NIST"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(182),
          notes: "5-point calibration (0, 25, 50, 75, 100 PSI up and down). Max hysteresis 0.8%. Passed.",
        },
      ],
    },

    // GAG-008 Flow Meter — factory cal, no interim records needed
    {
      equipmentId: equipIds[7],
      records: [
        {
          calibrationDate: daysFromNow(-53),
          performedBy: "Endress+Hauser Factory Cal",
          certNumber: "EH-FC-2024-00441",
          standardsReferenced: ["ISO 4185 (mass flow)", "OIML R117"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(312),
          notes: "OEM factory calibration. HART output verified. 3-point flow check. DAkkS-accredited certificate.",
        },
      ],
    },

    // GAG-009 Torque Wrench — OVERDUE (last cal expired)
    {
      equipmentId: equipIds[8],
      records: [
        {
          calibrationDate: daysFromNow(-388),
          performedBy: "Trescal, Inc.",
          certNumber: "TRC-2023-TRQ-5218",
          standardsReferenced: ["ISO 6789-2:2017"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(-22),
          notes: "5-point calibration per ISO 6789-2. Within ±2%. Calibration sticker applied.",
        },
      ],
    },

    // GAG-010 Hydrometer — 1 past cal, due in 28 days (in reminder window)
    {
      equipmentId: equipIds[9],
      records: [
        {
          calibrationDate: daysFromNow(-337),
          performedBy: "Precision Calibration Services",
          certNumber: "PCS-2023-HYD-0341",
          standardsReferenced: ["ASTM E100", "NIST SRM 211d (density of water)"],
          result: "conditional",
          outOfTolerance: false,
          adjustmentsMade: "One hydrometer (67H) repaired — scale decal reseated. Returned to service after re-verification.",
          nextDueDate: daysFromNow(28),
          notes: "Set of 3 calibrated. 67H had minor scale shift — corrected in place. 68H and 69H passed without adjustment.",
        },
      ],
    },

    // GAG-011 Boiling Point Tester — recent cal
    {
      equipmentId: equipIds[10],
      records: [
        {
          calibrationDate: daysFromNow(-211),
          performedBy: "Precision Calibration Services",
          certNumber: "PCS-2024-BPT-0778",
          standardsReferenced: ["FMVSS 116 571.116", "SAE J1703", "ASTM D1120"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(154),
          notes: "ERPBP heater output and thermocouple linearity verified. Reference fluid check at 205°C. Passed within ±1.5°C.",
        },
      ],
    },

    // GAG-012 Caliper — recent internal cal
    {
      equipmentId: equipIds[11],
      records: [
        {
          calType: "internal" as const,
          calibrationDate: daysFromNow(-298),
          performedBy: "Ebeni Villarreal",
          certNumber: "INT-CAL-2023-012",
          standardsReferenced: ["ASME B89.1.14", "NIST traceable gauge blocks"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(67),
          notes: "Calibrated against Grade 1 gauge blocks at 10, 50, 100, 150, 200mm. Max error 0.01mm. Passed.",
        },
      ],
    },

    // GAG-013 Customer pH Meter — 1 past cal
    {
      equipmentId: equipIds[12],
      records: [
        {
          calibrationDate: daysFromNow(-162),
          performedBy: "GM Supplier Quality Engineering",
          certNumber: "GM-SQE-PH-CS-2024-004",
          standardsReferenced: ["NIST SRM 185h", "NIST SRM 186i", "GM GSDB Section 7.1.5"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(18),
          notes: "Customer-arranged calibration. GM SQE representative witnessed. Certificate filed in GM customer portal and CCI document control.",
        },
      ],
    },

    // GAG-014 Turbidity Meter — recent internal cal, due in 9 days
    {
      equipmentId: equipIds[13],
      records: [
        {
          calType: "internal" as const,
          calibrationDate: daysFromNow(-171),
          performedBy: "Latasha Monroe",
          certNumber: "INT-TURB-2024-001",
          standardsReferenced: ["EPA Method 180.1", "HACH StablCal 0.1 & 100 NTU"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(9),
          notes: "Calibrated using StablCal formazin standards at 0.1 NTU, 10 NTU, and 100 NTU. Within ±1 NTU. Per environmental permit EP-2024-OH-00312.",
        },
      ],
    },

    // GAG-015 Temperature Datalogger — out of service, last cal expired
    {
      equipmentId: equipIds[14],
      records: [
        {
          calibrationDate: daysFromNow(-414),
          performedBy: "Trescal, Inc.",
          certNumber: "TRC-2023-LOG-6001",
          standardsReferenced: ["ITS-90", "NIST"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(-49),
          notes: "Annual calibration. 5-point check. Passed. Battery replaced during service visit. Currently out-of-service pending next scheduled cal cycle — not to be used.",
        },
      ],
    },
  ];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== CCI Chemical Calibration Module — Seed Script ===\n");
  console.log(`  User ID    : ${USER_ID}`);
  console.log(`  Project ID : ${PROJECT_ID}`);
  console.log(`  Equipment  : ${EQUIPMENT_SEEDS.length} gages\n`);

  // ── Idempotency check ───────────────────────────────────────────────────
  // Check for the specific first seed gage (CCI-GAG-001) rather than any
  // equipment, so the check is precise: custom equipment added by the user
  // will not falsely prevent the demo data from being seeded.
  const existing = await db
    .select({ id: calibrationEquipment.id })
    .from(calibrationEquipment)
    .where(
      and(
        eq(calibrationEquipment.userId, USER_ID),
        eq(calibrationEquipment.isoProjectId, PROJECT_ID),
        eq(calibrationEquipment.gageId, "CCI-GAG-001")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const eqCount = await db
      .select({ id: calibrationEquipment.id })
      .from(calibrationEquipment)
      .where(
        and(
          eq(calibrationEquipment.userId, USER_ID),
          eq(calibrationEquipment.isoProjectId, PROJECT_ID)
        )
      );
    const recCount = await db
      .select({ id: calibrationRecords.id })
      .from(calibrationRecords)
      .where(
        and(
          eq(calibrationRecords.userId, USER_ID),
          eq(calibrationRecords.isoProjectId, PROJECT_ID)
        )
      );
    const ootCount = await db
      .select({ id: calibrationOotAssessments.id })
      .from(calibrationOotAssessments)
      .where(
        and(
          eq(calibrationOotAssessments.userId, USER_ID),
          eq(calibrationOotAssessments.isoProjectId, PROJECT_ID)
        )
      );
    console.log(`✅ Already seeded — skipping insert.`);
    console.log(`   Equipment  : ${eqCount.length} gages`);
    console.log(`   Records    : ${recCount.length} calibration records`);
    console.log(`   OOT Assmts : ${ootCount.length} OOT assessments`);
    console.log(`\n   Re-run is safe — nothing changed.\n`);
    process.exit(0);
  }

  await clearExisting();

  // Ensure the conductivity meter calibration work instruction exists
  console.log("  Ensuring calibration work instruction (WI-CAL-003)…");
  const calWiId = await ensureCalibrationWI();

  // Insert equipment
  console.log("  Inserting calibration equipment…");
  const insertedEquip: number[] = [];

  for (const eq of EQUIPMENT_SEEDS) {
    const [row] = await db
      .insert(calibrationEquipment)
      .values({
        userId: USER_ID,
        isoProjectId: PROJECT_ID,
        ...eq,
      })
      .returning({ id: calibrationEquipment.id });
    insertedEquip.push(row.id);
    console.log(`    ✓ ${eq.gageId} — ${eq.name}`);
  }

  // Link WI-CAL-003 to GAG-005 (Conductivity Meter — index 4 in EQUIPMENT_SEEDS)
  await db
    .update(calibrationEquipment)
    .set({ linkedDocumentId: calWiId })
    .where(eq(calibrationEquipment.id, insertedEquip[4]));
  console.log(`    ✓ Linked WI-CAL-003 (doc ID ${calWiId}) → CCI-GAG-005`);

  console.log(`\n  Inserting calibration history records…`);
  const recordSets = buildRecords(insertedEquip);

  let totalRec = 0;
  let totalOot = 0;

  for (const set of recordSets) {
    for (const rec of set.records) {
      const { oot, ...recData } = rec;

      const [newRec] = await db
        .insert(calibrationRecords)
        .values({
          userId: USER_ID,
          isoProjectId: PROJECT_ID,
          equipmentId: set.equipmentId,
          ...recData,
        })
        .returning({ id: calibrationRecords.id });

      totalRec++;

      if (oot) {
        await db.insert(calibrationOotAssessments).values({
          userId: USER_ID,
          isoProjectId: PROJECT_ID,
          calibrationRecordId: newRec.id,
          equipmentId: set.equipmentId,
          affectedProducts: oot.affectedProducts,
          suspectDateStart: oot.suspectDateStart,
          suspectDateEnd: oot.suspectDateEnd,
          disposition: oot.disposition,
          riskLevel: oot.riskLevel,
          containmentActions: oot.containmentActions,
          correctiveActionRef: oot.correctiveActionRef,
          assessedBy: oot.assessedBy,
          assessmentDate: oot.assessmentDate,
          notes: oot.notes,
        });
        totalOot++;
        console.log(`    ✓ OOT assessment: Equipment ID ${set.equipmentId} — CAR ref ${oot.correctiveActionRef}`);
      }
    }
  }

  // ── IATF 7.1.5.3.1 Internal Lab Scope ──────────────────────────────────
  console.log("\n  ── Internal Lab Scope (7.1.5.3.1) ─────────────────");
  await db.delete(calibrationLabScope).where(eq(calibrationLabScope.userId, USER_ID));
  await db.insert(calibrationLabScope).values({
    userId: USER_ID,
    isoProjectId: PROJECT_ID,
    labName: "CCI Chemical Internal Quality Control Laboratory",
    labDocumentNumber: "LAB-SCOPE-001",
    labLocation: "Building A, QC Laboratory — 4420 Industrial Pkwy, Dayton, OH 45414",
    labManager: "Ebeni Villarreal, Quality Engineer",
    qualitySystemStatement: "This Internal Laboratory Scope defines the scope of calibration and testing activities performed by CCI Chemical, Inc. in accordance with IATF 16949:2016 7.1.5.3.1. The laboratory is responsible for all in-process quality control measurements, inline calibration of designated gages, and measurement system validation for brake fluid (DOT 3, DOT 4, DOT 5.1) and automotive coolant (EG/PG-based) product lines. All laboratory activities are conducted in accordance with this scope document, the CCI Chemical Quality Manual (QM-001), and applicable customer-specific requirements.",
    revision: "A",
    effectiveDate: "2025-01-15",
    nextReviewDate: "2026-01-15",
    approvedBy: "David Rojas, Quality Director",
    personnelRequirements: [
      { id: "pr-1", role: "QC Technician", minEducation: "High School Diploma or GED", requiredTraining: "WI-CAL-003 (Conductivity Meter), WI-002 (Viscosity Testing), WI-003 (Incoming RM Inspection), IATF 16949 Awareness Training, Lab Safety & PPE Orientation", certifications: "None required (internal competency evaluation conducted annually)", competencyVerification: "Annual practical competency demonstration scored on CCI-COMP-EVAL-001 form; minimum score 80% required", supervisionRequired: false },
      { id: "pr-2", role: "QC Lead / Lab Supervisor", minEducation: "Associate degree in Chemistry, Chemical Technology, or related field", requiredTraining: "All QC Technician training plus: Internal Auditor Training (IATF 16949), MSA Awareness, APQP/PPAP fundamentals, Customer-Specific Requirements (GM, Ford, Stellantis)", certifications: "Preferred: ASQ CQI or CQT; Internal Auditor certification", competencyVerification: "Annual performance review; bi-annual practical assessment. Must demonstrate ability to perform and document all in-scope calibrations independently.", supervisionRequired: false },
      { id: "pr-3", role: "QC Intern / New Hire (Probationary)", minEducation: "High School Diploma or GED", requiredTraining: "WI-CAL-003, WI-002, WI-003, Lab Safety & PPE. All training must be completed within 30 days of start date.", certifications: "None required", competencyVerification: "Monthly practical check during first 90 days; requires supervisor sign-off on each calibration performed during probation", supervisionRequired: true },
    ],
    environmentalRequirements: {
      temperature: "20°C ± 2°C (68°F ± 4°F) — monitored continuously; measurements invalid if temperature deviates > ±2°C from nominal",
      humidity: "35–65% RH — relative humidity monitored and logged daily; pH and conductivity measurements require humidity ≤ 60%",
      lighting: "Minimum 500 lux at all measurement workstations (calibrated annually via lux meter); 750 lux required at visual inspection stations",
      vibration: "Vibration-isolated workbench required for pH meter and conductivity meter measurements; caliper measurements require stable, non-vibrating surface. Blending operations in adjacent bays must be suspended during precision dimensional measurements.",
      cleanliness: "Lab coat and nitrile gloves required for all measurements. No food, drink, or strong chemical odors in the QC lab. Sample containers must be clean and labeled per CCI-LAB-PROT-001. pH electrode storage solution must be replaced monthly.",
      monitoring: "Temperature and humidity logged three times daily on CCI-ENV-MON-001 form. Electronic probe (Traceable® Temp/RH Meter, Serial: TM-2024-001) calibrated annually. Monitoring records retained for minimum 3 years.",
      additionalControls: "Electromagnetic interference: pH meters and conductivity meters must be kept ≥ 50 cm from transformers, motors, or high-current equipment. Chemicals: brake fluid and coolant samples must be sealed when not in use. All reference standards stored per manufacturer SDS at 4–25°C.",
    },
    customerRequirements: [
      { id: "csr-1", customer: "General Motors (GM)", requirement: "All measurement systems referenced in the GM PPAP Control Plan must have documented MSA studies (Gage R&R ≤ 30% for critical characteristics). PPAP documentation must include measurement system validation results. pH, conductivity, and concentration measurements for GM-approved brake fluid and coolant programs require documented calibration traceability to NIST.", reference: "GM Supplier Requirements Manual (GSDB) — Rev. 9, Section 4.2; GM CSR Supplement to IATF 16949 7.1.5", applicableTo: "All in-process and final inspection measurement systems for GM-approved product lines (DOT 3, DOT 4 brake fluids; DexCool® compatible coolants)" },
      { id: "csr-2", customer: "Ford Motor Company", requirement: "Ford Q1 Program: Measurement systems must be validated per AIAG MSA Reference Manual (4th edition). Calibration certificates for all reference standards must be retained and traceable to NIST or international equivalents. Ford CSR requires that any OOT finding be reported to Ford SQE within 24 hours if product shipped to Ford was potentially affected.", reference: "Ford Q1 Manufacturing Site Assessment; Ford CSR for IATF 16949 — Section 7.1.5; Ford PPAP Requirements Manual", applicableTo: "All measurement systems for Ford-directed product programs; OOT notification applies to products in Ford's current model year supply chain" },
      { id: "csr-3", customer: "Stellantis (formerly FCA)", requirement: "Stellantis CSR requires use of AIAG MSA 4th Ed. for all new measurement systems. Calibration recall system must generate automatic notifications ≥ 30 days before calibration due date. Lab scope document must be reviewed annually and records of review retained.", reference: "Stellantis Supplier Quality Requirements (SQ00010); Stellantis CSR for IATF 16949", applicableTo: "Stellantis-directed product programs; DOT 3/4 brake fluid and engine coolant supply" },
      { id: "csr-4", customer: "AIAG / VDA FMEA (Industry Standard)", requirement: "Product and Process FMEA must reference measurement system adequacy as a detection control effectiveness factor. Control Plans must identify measurement method, sample frequency, control method, and reaction plan for each characteristic. Measurement systems cited in Control Plans must have corresponding entries in this Lab Scope.", reference: "AIAG-VDA FMEA Handbook (1st Ed., 2019); AIAG APQP & Control Plan Reference Manual (2nd Ed.)", applicableTo: "All product characteristics in the FMEA and Control Plan for IATF 16949 certified programs" },
    ],
    additionalCapabilities: [
      { id: "cap-1", parameter: "Kinematic Viscosity", method: "ASTM D2170 / ASTM D2171", equipment: "Cannon-Fenske Viscometer — Size 200 (Lot: CF-CCI-001)", range: "0.4 – 16,000 mm²/s (cSt)", tolerance: "± 0.35% of reading", traceability: "NIST SRM 2950a Viscosity Standard (traceable to SI units via NIST Certificate of Calibration)", workInstruction: "WI-002 Viscosity Testing Procedure — Cannon-Fenske Reverse-Flow Method" },
      { id: "cap-2", parameter: "Wet Boiling Point (WBP) — Brake Fluid", method: "ASTM D1120 / FMVSS No. 116", equipment: "Boiling Point Tester — Stanhope-Seta Model 17200 (GAG-013 — External Cal)", range: "150°C – 300°C", tolerance: "± 1°C", traceability: "NIST SRM 934 SPRT Reference Thermometer (used for annual verification of reference thermometer)", workInstruction: "CCI-BP-TEST-001 Wet Boiling Point Procedure per ASTM D1120" },
      { id: "cap-3", parameter: "Equilibrium Reflux Boiling Point (ERBP) — Brake Fluid", method: "ASTM D2093 / ISO 7308", equipment: "ERBP Apparatus — Stanhope-Seta EAI Model 25.000 (Serial: ERBP-001)", range: "175°C – 350°C", tolerance: "± 1°C", traceability: "NIST-traceable reference thermometer (calibrated annually by external ISO 17025 lab)", workInstruction: "CCI-ERBP-PROC-001 Equilibrium Reflux Boiling Point Procedure" },
      { id: "cap-4", parameter: "pH of Aqueous Extract — Coolant", method: "ASTM D1384 / ASTM E70", equipment: "GAG-001 — Orion Star A111 pH Meter (Internal Cal)", range: "4.0 – 10.0 pH units", tolerance: "± 0.05 pH units", traceability: "NIST SRM 185h (pH 4.00) / SRM 186h (pH 6.86 / 9.18) Buffer Reference Solutions", workInstruction: "pH testing per ASTM D1384 Section 7.3 using GAG-001 internal calibration procedure" },
      { id: "cap-5", parameter: "Specific Gravity / Coolant Concentration", method: "ASTM E1164 / ASTM E100", equipment: "GAG-004 — Bellingham+Stanley Refractometer (Internal Cal); GAG-015 — Anton Paar Densitometer (External)", range: "0.900 – 1.200 g/mL; 1.3330 – 1.4300 nD", tolerance: "± 0.0005 g/mL; ± 0.0002 nD", traceability: "NIST SRM 1937 Certified Sucrose Reference Solution; NIST-traceable hydrometer set", workInstruction: "CCI-CONC-TEST-001 Refractometer concentration check; ASTM E1164 for densitometer" },
    ],
  });
  console.log("    ✓ Internal Lab Scope (LAB-SCOPE-001) — Rev. A, 5 additional capabilities, 3 personnel roles, 4 CSRs");

  console.log(`\n  ─── Summary ────────────────────────────────────────`);
  console.log(`  Equipment inserted : ${insertedEquip.length}`);
  console.log(`  Cal records        : ${totalRec}`);
  console.log(`  OOT assessments    : ${totalOot}`);
  console.log(`\n  Gages with upcoming due dates (within 30 days):`);
  console.log(`    CCI-GAG-001 — pH Meter (due in 12 days)`);
  console.log(`    CCI-GAG-005 — Conductivity Meter (due in 5 days)`);
  console.log(`    CCI-GAG-010 — Hydrometer Set (due in 28 days)`);
  console.log(`    CCI-GAG-013 — Customer pH Meter (due in 18 days)`);
  console.log(`    CCI-GAG-014 — Turbidity Meter (due in 9 days)`);
  console.log(`\n  Overdue gages:`);
  console.log(`    CCI-GAG-003 — Viscometer (8 days overdue)`);
  console.log(`    CCI-GAG-009 — Torque Wrench (22 days overdue)`);
  console.log(`    CCI-GAG-015 — Temp Datalogger (49 days overdue — out of service)`);
  console.log(`\n  OOT history: GAG-003 (Viscometer, 2023 — CAPA CAR-2023-017)\n`);
  console.log("  Done.\n");
}

main().catch((err) => {
  console.error("\n[ERROR]", err.message ?? err);
  process.exit(1);
});
