/**
 * Seeds record #41 (Digital Caliper CCI-GAG-012) with a fully populated
 * calibration record including pre-cal checks, gage block reference standards,
 * multi-point measurement data, and environmental conditions.
 */
import { db } from "../server/db";
import { calibrationRecords } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const preCalibrationChecks = {
    visualInspectionPass: true,
    zeroCheckPass: true,
    equipmentClean: true,
    notes: "Jaws wiped with isopropyl alcohol and lint-free cloth. Zero confirmed closed-jaw and with 25mm block check. No nicks or burrs on measuring faces.",
  };

  const referenceStandards = [
    {
      id: "rs-001",
      description: "Grade 2 Rectangular Gage Block Set — 81 pc",
      identification: "GBS-LAB-003",
      certNumber: "TRESCAL-GB-2025-0441",
      certDueDate: "2026-06-15",
      traceability: "NIST",
    },
    {
      id: "rs-002",
      description: "Mitutoyo Digital Caliper Reference Standard (200mm)",
      identification: "REF-CAL-200",
      certNumber: "TRESCAL-CAL-2025-0189",
      certDueDate: "2026-06-15",
      traceability: "NIST",
    },
  ];

  // 8 checkpoints across 0–200mm range using gage blocks
  // Tolerance: ±0.02mm  |  3 trials per point  |  all within spec
  const measurementData = [
    {
      id: "mp-001",
      nominalValue: "25.000",
      unit: "mm",
      trial1: "25.001",
      trial2: "25.000",
      trial3: "25.001",
      withinTolerance: true,
      notes: "",
    },
    {
      id: "mp-002",
      nominalValue: "50.000",
      unit: "mm",
      trial1: "50.002",
      trial2: "50.001",
      trial3: "50.002",
      withinTolerance: true,
      notes: "",
    },
    {
      id: "mp-003",
      nominalValue: "75.000",
      unit: "mm",
      trial1: "75.003",
      trial2: "75.002",
      trial3: "75.003",
      withinTolerance: true,
      notes: "",
    },
    {
      id: "mp-004",
      nominalValue: "100.000",
      unit: "mm",
      trial1: "100.004",
      trial2: "100.003",
      trial3: "100.004",
      withinTolerance: true,
      notes: "",
    },
    {
      id: "mp-005",
      nominalValue: "125.000",
      unit: "mm",
      trial1: "125.005",
      trial2: "125.004",
      trial3: "125.005",
      withinTolerance: true,
      notes: "",
    },
    {
      id: "mp-006",
      nominalValue: "150.000",
      unit: "mm",
      trial1: "150.006",
      trial2: "150.005",
      trial3: "150.006",
      withinTolerance: true,
      notes: "Slight drag noted at 150mm; re-cleaned and re-measured. Third trial confirmed within spec.",
    },
    {
      id: "mp-007",
      nominalValue: "175.000",
      unit: "mm",
      trial1: "175.008",
      trial2: "175.007",
      trial3: "175.008",
      withinTolerance: true,
      notes: "",
    },
    {
      id: "mp-008",
      nominalValue: "200.000",
      unit: "mm",
      trial1: "200.011",
      trial2: "200.010",
      trial3: "200.011",
      withinTolerance: true,
      notes: "Error at full-scale (200mm) is +0.011mm — well within ±0.02mm tolerance. Typical for caliper class.",
    },
  ];

  const update = {
    performedBy: "Ebeni Villarreal — Quality Engineer",
    certNumber: "CCI-CAL-2025-GAG012",
    standardsReferenced: ["ANSI/ASME B89.1.14", "ASME B89.7.3.1", "ISO 14978"],
    result: "pass" as const,
    outOfTolerance: false,
    adjustmentsMade: "No adjustment required. All 8 measurement points within ±0.02mm tolerance. No zero offset detected. Caliper returned to service as-is.",
    notes: "Annual internal calibration per WI-QC-003. Instrument in excellent condition. Recommend maintaining 12-month calibration interval. Full scale error at 200mm is +0.011mm (55% of tolerance band) — monitor trend at next calibration.",
    // Environmental
    environmentConditions: "Temp: 68°F (20°C), Humidity: 47%, vibration-free granite surface plate",
    // AS9100D measurement uncertainty (shown for all projects as best practice)
    measurementUncertainty: "U = ±0.006 mm (k=2, 95% confidence, per GBS lab cert TRESCAL-GB-2025-0441)",
    asFoundReading: "25.001 mm at 25mm checkpoint — no adjustment needed",
    asLeftReading: "25.001 mm — as-found = as-left, no adjustment made",
    labAccredited: false, // internal calibration
    // IATF 7.1.5.2.1
    softwareVerified: false,
    // New JSON fields
    preCalibrationChecks,
    referenceStandards,
    measurementData,
  };

  await db.update(calibrationRecords)
    .set(update as any)
    .where(eq(calibrationRecords.id, 41));

  console.log("✅ Record #41 (Digital Caliper CCI-GAG-012) fully populated.");
  console.log(`   ${measurementData.length} measurement points across 0–200mm range`);
  console.log(`   ${referenceStandards.length} reference standards documented`);
  console.log("   Pre-calibration checks, environmental conditions, uncertainty all set.");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
