/**
 * Seed script: CCI Chemical, Inc. — Calibration Module sample data
 * Run: npx tsx scripts/seed-cci-calibration.ts
 *
 * CCI Chemical is a brake fluid (DOT 3/4/5.1) and coolant (EG/PG-based)
 * manufacturer in Dayton, OH, certified to IATF 16949.
 *
 * Covers IATF 16949 §7.1.5 (Monitoring & Measurement Resources)
 * and §7.1.5.3 (MSA / Out-of-Tolerance) requirements.
 *
 * Project ID : 4   (CCI Chemical IATF 16949 QMS)
 * User ID    : 54320068  (Ebeni Villarreal)
 */

import { db } from "../server/db";
import {
  calibrationEquipment,
  calibrationRecords,
  calibrationOotAssessments,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

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

    // GAG-005 Conductivity — past cal, due in 5 days
    {
      equipmentId: equipIds[4],
      records: [
        {
          calibrationDate: daysFromNow(-175),
          performedBy: "Ebeni Villarreal",
          certNumber: "INT-COND-2024-002",
          standardsReferenced: ["NIST SRM 3190 (conductivity standard 1413 µS/cm)"],
          result: "pass",
          outOfTolerance: false,
          nextDueDate: daysFromNow(5),
          notes: "Two-point calibration at 84 µS/cm and 1413 µS/cm. Cell constant verified. Temperature compensation confirmed.",
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
          standardsReferenced: ["FMVSS 116 §571.116", "SAE J1703", "ASTM D1120"],
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

  await clearExisting();

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
