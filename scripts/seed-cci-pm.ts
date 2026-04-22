/**
 * Seed script: CCI Chemical, Inc. — Preventive Maintenance Module
 *
 * Populates realistic IATF 16949-oriented PM equipment and history for
 * project_id = 4 (CCI Chemical, user 54320068).
 *
 * Run: npx tsx scripts/seed-cci-pm.ts
 * Idempotent: clears pm_equipment and pm_records for this project, then re-seeds.
 */

import { db } from "../server/db";
import { pmEquipment, pmRecords } from "../shared/schema";
import { eq } from "drizzle-orm";

const USER_ID    = "54320068";
const PROJECT_ID = 4;

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ─── Equipment definitions ────────────────────────────────────────────────────

const EQUIPMENT = [
  {
    equipmentId: "PM-001",
    name: "Air Compressor — Main Plant",
    type: "Compressor",
    manufacturer: "Ingersoll Rand",
    model: "R55i",
    serialNumber: "IR-2019-R55-0047",
    location: "Utility Room A",
    department: "Facilities / Maintenance",
    responsiblePerson: "Carlos Rivera",
    responsibleEmail: "crivera@ccichemical.com",
    frequencyType: "monthly",
    frequencyDays: 30,
    lastPmDate: daysAgo(12),
    nextDueDate: daysFromNow(18),
    estimatedDurationHours: "2.0",
    criticalityRating: "critical",
    maintenanceType: "preventive",
    isKeyProductionEquipment: true,
    breakdownImpact: "Loss of compressed air halts all pneumatic equipment, filling lines, and laboratory instrumentation. Full plant shutdown within 4 hours.",
    contingencyPlan: "Portable rental compressor (Atlas Copco XAS 88) on 4-hour call from Smith Equipment. Emergency contact: 1-800-555-0192.",
    sparePartsInventory: "Oil filter (PN IR-39868271) x4; Air/Oil separator (PN IR-92746965) x2; Inlet filter (PN IR-54672050) x2; Drive belts x2 sets. Location: Spare Parts Room, Shelf B-3.",
    oeeTarget: "92%",
    installDate: "2019-03-15",
    warrantyExpiry: "2022-03-15",
    maintenanceContractor: "Ingersoll Rand Authorized Service — Midwest Branch",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "1. Lock out compressor (LOTO procedure CCI-LOTO-007)\n2. Drain condensate trap\n3. Replace oil filter (every 2000 hrs or monthly, whichever first)\n4. Check/clean inlet filter\n5. Inspect drive belts for wear and tension\n6. Check all fluid levels and top off\n7. Inspect oil/air separator — replace if dp > 15 psi\n8. Check all pressure relief valves\n9. Log oil pressure, discharge temp, and amp draw\n10. Remove LOTO and run functional test — verify pressure reaches 125 psi within 3 min",
    status: "active",
    notes: "Last major overhaul: 2022-09-10 (6,000 hr service). Oil analysis done quarterly — contact TotalCare Lab.",
  },
  {
    equipmentId: "PM-002",
    name: "Industrial Chiller — Reactor Cooling Loop",
    type: "Chiller / Refrigeration",
    manufacturer: "Trane",
    model: "CGAM-050",
    serialNumber: "TR-CGAM-2020-1134",
    location: "Roof — Cooling Plant",
    department: "Production",
    responsiblePerson: "Maria Santos",
    responsibleEmail: "msantos@ccichemical.com",
    frequencyType: "quarterly",
    frequencyDays: 90,
    lastPmDate: daysAgo(95),
    nextDueDate: daysFromNow(-5),  // Overdue
    estimatedDurationHours: "4.0",
    criticalityRating: "critical",
    maintenanceType: "preventive",
    isKeyProductionEquipment: true,
    breakdownImpact: "Loss of reactor cooling causes batch temperature excursions, product quality failures, and potential runaway reaction risk. Immediate process shutdown required.",
    contingencyPlan: "Standby cooling loop (Chiller PM-002B) available with 30-min switchover. Safety team must be notified immediately. Batch in progress must be evaluated by Quality.",
    sparePartsInventory: "Refrigerant R-410A (30 lbs on-site); Condenser fan motor (PN TR-CNF-050) x1; Control board (PN TR-CTL-2020) x1 — stored Climate Control Room.",
    oeeTarget: "95%",
    installDate: "2020-06-01",
    warrantyExpiry: "2025-06-01",
    maintenanceContractor: "Trane Midwest — HVAC/R Certified Technicians",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "1. Lock out chiller per LOTO-009\n2. Check refrigerant charge and system pressures\n3. Clean condenser coils (nitrogen purge + brush)\n4. Inspect evaporator tubes — clean if fouling detected\n5. Replace filter driers if moisture indicator shows yellow\n6. Check compressor oil level and add if needed\n7. Tighten all electrical connections\n8. Inspect/test flow switch and freeze protection\n9. Record supply/return water temp, refrigerant suction/discharge pressure\n10. Run startup test — verify setpoint control and alarms",
    status: "active",
    notes: "Unit OVERDUE for quarterly PM. Schedule immediately. Refrigerant leak check required per EPA 608 — last check 2024-09-10.",
  },
  {
    equipmentId: "PM-003",
    name: "Drum Mixer — Batch Reactor #1",
    type: "Mixer / Agitator",
    manufacturer: "Lightnin",
    model: "XJR-50",
    serialNumber: "LTN-XJR-2018-0283",
    location: "Reactor Bay 1",
    department: "Production",
    responsiblePerson: "Jose Morales",
    responsibleEmail: "jmorales@ccichemical.com",
    frequencyType: "monthly",
    frequencyDays: 30,
    lastPmDate: daysAgo(28),
    nextDueDate: daysFromNow(2),   // Due in 2 days
    estimatedDurationHours: "1.5",
    criticalityRating: "high",
    maintenanceType: "preventive",
    isKeyProductionEquipment: true,
    breakdownImpact: "Mixer failure during batch causes incomplete mixing, product homogeneity failure, and batch rejection. Estimated $18,000 per batch lost.",
    contingencyPlan: "Portable clamp-mount mixer (Lightnin E100) available in Equipment Room. Transfer batch to Reactor Bay 2 if portable mixer insufficient.",
    sparePartsInventory: "Mechanical seal kit (PN LTN-MSK-XJR50) x2; Impeller shaft bearing set x1; Drive coupling x1. Location: Maintenance Room, Cabinet M-7.",
    oeeTarget: "88%",
    installDate: "2018-11-20",
    warrantyExpiry: "2021-11-20",
    maintenanceContractor: null,
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "1. Confirm reactor is empty and clean; LOTO per CCI-LOTO-003\n2. Check mechanical seal for leaks — replace if weeping\n3. Lubricate all grease points (per lubrication chart LUB-RX1)\n4. Inspect impeller blades for wear, corrosion, and damage\n5. Check shaft alignment and coupling condition\n6. Megger test motor insulation resistance (> 100 MΩ)\n7. Record motor amp draw at rated RPM\n8. Check all bolts and clamps — re-torque to spec\n9. Functional test at 50% and 100% speed",
    status: "active",
    notes: "Last seal replacement: 2024-07-15. Seal life expectancy ~18 months at current duty.",
  },
  {
    equipmentId: "PM-004",
    name: "High-Pressure Dosing Pump — Chemical Transfer Line A",
    type: "Pump",
    manufacturer: "ProMinent",
    model: "Gamma/X 020",
    serialNumber: "PRO-GXS-2021-4419",
    location: "Chemical Storage Area — Line A",
    department: "Production",
    responsiblePerson: "Jose Morales",
    responsibleEmail: "jmorales@ccichemical.com",
    frequencyType: "monthly",
    frequencyDays: 30,
    lastPmDate: daysAgo(35),
    nextDueDate: daysFromNow(-5),  // Overdue
    estimatedDurationHours: "1.0",
    criticalityRating: "high",
    maintenanceType: "preventive",
    isKeyProductionEquipment: true,
    breakdownImpact: "Dosing pump failure causes incorrect chemical addition ratios, product quality nonconformance, and potential overfilling of downstream vessels.",
    contingencyPlan: "Backup pump PM-004B on standby in Chemical Storage. Changeover takes ~20 min. Quality must re-evaluate batch if pump failed mid-cycle.",
    sparePartsInventory: "PTFE diaphragm (PN PRO-DPH-020) x4; Valve ball set x2; Dosing head kit x1. Location: Maintenance Cabinet C-2.",
    oeeTarget: null,
    installDate: "2021-04-05",
    warrantyExpiry: "2023-04-05",
    maintenanceContractor: "ProMinent Fluid Controls, Inc.",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "1. Isolate pump and flush line — PPE required (gloves, goggles, face shield)\n2. Inspect PTFE diaphragm for micro-cracks or deformation — replace if in doubt\n3. Check suction and discharge valve balls for wear and proper seating\n4. Inspect dosing head for chemical buildup or leaks\n5. Calibrate pump output (gravimetric test — 1000 ml ± 2%)\n6. Check all fittings and connections for leaks\n7. Record stroke frequency and pressure at calibration flow rate",
    status: "active",
    notes: "OVERDUE — missed last PM window. Chemical dosing accuracy must be verified before next production run.",
  },
  {
    equipmentId: "PM-005",
    name: "Filling & Capping Machine — Line 2",
    type: "Filling / Dosing Machine",
    manufacturer: "FILAMATIC",
    model: "VF-5",
    serialNumber: "FIL-VF5-2019-0078",
    location: "Packaging Hall — Line 2",
    department: "Packaging",
    responsiblePerson: "Ana Gutierrez",
    responsibleEmail: "agutierrez@ccichemical.com",
    frequencyType: "weekly",
    frequencyDays: 7,
    lastPmDate: daysAgo(5),
    nextDueDate: daysFromNow(2),   // Due in 2 days
    estimatedDurationHours: "1.0",
    criticalityRating: "high",
    maintenanceType: "tpm",
    isKeyProductionEquipment: true,
    breakdownImpact: "Filling line downtime reduces packaging output by 50%. Customer delivery commitments at risk for time-sensitive orders.",
    contingencyPlan: "Manual filling using calibrated hand pumps — throughput reduced to ~15% of machine capacity. Overtime authorized for manual operations. Notify customer service.",
    sparePartsInventory: "Fill nozzle O-ring kit x10; Piston seal x5; Drive belt set x2; Capping chuck x3. Location: Packaging Maintenance Cabinet.",
    oeeTarget: "85%",
    installDate: "2019-08-10",
    warrantyExpiry: "2022-08-10",
    maintenanceContractor: "FILAMATIC Service Group",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "WEEKLY PM:\n1. Wipe down all product contact surfaces with approved cleaner\n2. Inspect all O-rings and seals — replace if showing wear\n3. Check fill volume accuracy (3 test fills ± 1%)\n4. Inspect capper torque — adjust if cap torque outside 15-20 in-lb\n5. Lubricate all specified lube points (per chart on machine door)\n6. Check drive belt tension and condition\n7. Clear any product residue from nozzles\n8. Record fill volume measurements in PM log",
    status: "active",
    notes: "TPM team: Operators complete daily wipe-down checklist (form CCI-TPM-FL2). Weekly PM performed by maintenance.",
  },
  {
    equipmentId: "PM-006",
    name: "Industrial HVAC — Production Hall",
    type: "HVAC / Air Handler",
    manufacturer: "Carrier",
    model: "39LA060",
    serialNumber: "CAR-AHU-2017-2231",
    location: "Roof — AHU-01",
    department: "Facilities / Maintenance",
    responsiblePerson: "Carlos Rivera",
    responsibleEmail: "crivera@ccichemical.com",
    frequencyType: "quarterly",
    frequencyDays: 90,
    lastPmDate: daysAgo(22),
    nextDueDate: daysFromNow(68),
    estimatedDurationHours: "3.5",
    criticalityRating: "medium",
    maintenanceType: "preventive",
    isKeyProductionEquipment: false,
    breakdownImpact: "Loss of HVAC causes temperature/humidity excursions in production hall. May affect product quality if room conditions exceed specification limits.",
    contingencyPlan: "Portable industrial fans and spot coolers available. Production may continue at reduced capacity in moderate weather. Halt if temperature exceeds 85°F.",
    sparePartsInventory: "MERV-13 filters (24x24x2) x6; Drive belt A-58 x2; Condenser motor capacitor x1. Location: Facilities Storage, Section F.",
    oeeTarget: null,
    installDate: "2017-05-20",
    warrantyExpiry: "2020-05-20",
    maintenanceContractor: "Carrier Commercial Services — Contract #CC-2024-8811",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "QUARTERLY PM:\n1. Replace MERV-13 supply air filters\n2. Clean evaporator coil (brush + coil cleaner)\n3. Clean/treat condensate drain pan (biocide tablet)\n4. Check refrigerant charge and pressures (EPA 608 cert required)\n5. Inspect/lubricate motor bearings and fan shaft\n6. Check drive belt tension and wear\n7. Verify thermostat and controls calibration (± 1°F)\n8. Inspect all ductwork dampers\n9. Record supply air temp, return temp, outdoor air %",
    status: "active",
    notes: "Annual coil cleaning contract with Carrier. Filter change log on-site in Facilities Binder.",
  },
  {
    equipmentId: "PM-007",
    name: "Vacuum Distillation Unit",
    type: "Vacuum System",
    manufacturer: "Busch",
    model: "RC 0305 B",
    serialNumber: "BUS-RC305-2020-0556",
    location: "Reactor Bay 2 — Process Skid",
    department: "Production",
    responsiblePerson: "Maria Santos",
    responsibleEmail: "msantos@ccichemical.com",
    frequencyType: "quarterly",
    frequencyDays: 90,
    lastPmDate: daysAgo(60),
    nextDueDate: daysFromNow(30),
    estimatedDurationHours: "3.0",
    criticalityRating: "high",
    maintenanceType: "preventive",
    isKeyProductionEquipment: true,
    breakdownImpact: "Vacuum failure causes distillation batch failures and product purity out of spec. Batch rejection rate near 100% if vacuum falls below 10 mbar during critical phase.",
    contingencyPlan: "Emergency rental vacuum pump available from Busch within 24 hours (PN on PO in Purchasing). Quality must quarantine product if vacuum interrupted during distillation.",
    sparePartsInventory: "Vacuum pump oil (Busch VM 100, 5L) x2; Inlet filter x2; Exhaust filter x2; Oil separator x1. Location: Process Maintenance Cage.",
    oeeTarget: null,
    installDate: "2020-02-12",
    warrantyExpiry: "2023-02-12",
    maintenanceContractor: "Busch Vacuum Solutions — authorized service",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "QUARTERLY PM:\n1. Change vacuum pump oil (drain, flush with new oil, refill to sight glass)\n2. Replace inlet and exhaust filters\n3. Inspect/replace oil separator if oil carryover detected\n4. Check all vacuum fittings and seals for leaks (soap bubble test)\n5. Measure ultimate vacuum level (should reach < 0.5 mbar)\n6. Calibrate vacuum gauge against calibrated reference\n7. Record oil change date, filter P/Ns, and ultimate vacuum reading",
    status: "active",
    notes: "Oil analysis quarterly — send 100 ml sample to CCI Quality Lab. Oil change record per SOP PRD-016.",
  },
  {
    equipmentId: "PM-008",
    name: "Centrifuge — Separation Unit",
    type: "Centrifuge",
    manufacturer: "Alfa Laval",
    model: "BRPX 213",
    serialNumber: "AL-BRPX-2018-7822",
    location: "Separation Room — Zone B",
    department: "Production",
    responsiblePerson: "Jose Morales",
    responsibleEmail: "jmorales@ccichemical.com",
    frequencyType: "semi_annual",
    frequencyDays: 180,
    lastPmDate: daysAgo(185),
    nextDueDate: daysFromNow(-5),  // Overdue
    estimatedDurationHours: "6.0",
    criticalityRating: "critical",
    maintenanceType: "preventive",
    isKeyProductionEquipment: true,
    breakdownImpact: "Centrifuge failure stops all liquid-solid separation operations. Critical path machine — no alternative available on-site. Estimated 3-5 day repair lead time.",
    contingencyPlan: "Contact Alfa Laval Emergency Service (+1-800-555-9871). Evaluate filter press as temporary alternative — capacity limited. Customer notification required if delays exceed 48 hours.",
    sparePartsInventory: "Bowl gasket set x2; Main bearing set (PN AL-BRG-BRPX213) x1; Disc stack (PN AL-DSC-BRPX213) x1 spare set. Location: Secure Parts Storage, Shelf C-1.",
    oeeTarget: "90%",
    installDate: "2018-07-05",
    warrantyExpiry: "2021-07-05",
    maintenanceContractor: "Alfa Laval Service — contract renewal due 2025-06-01",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "SEMI-ANNUAL MAJOR PM (Alfa Laval procedure ALF-BRPX-PM-02):\n1. LOTO per CCI-LOTO-011 — requires two-person sign-off\n2. Full bowl disassembly and inspection\n3. Clean all discs and bowl sections — inspect for erosion and corrosion\n4. Replace bowl gaskets and O-rings\n5. Replace main spindle bearings\n6. Balance check on all rotating elements\n7. Inspect and clean inlet/outlet connections\n8. Reassemble to Alfa Laval torque specifications\n9. Dynamic balance test post-assembly (vibration < 2.5 mm/s)\n10. Process trial run — verify separation efficiency meets SOP PRD-031 targets",
    status: "active",
    notes: "OVERDUE — semi-annual PM missed. Vibration slightly elevated on last week's data. Schedule immediately. Alfa Laval service engineer required for bowl bearing replacement.",
  },
  {
    equipmentId: "PM-009",
    name: "Shell & Tube Heat Exchanger — HX-101",
    type: "Heat Exchanger",
    manufacturer: "Graham",
    model: "ST-400",
    serialNumber: "GRM-ST400-2016-0334",
    location: "Process Corridor — HX Room",
    department: "Production",
    responsiblePerson: "Maria Santos",
    responsibleEmail: "msantos@ccichemical.com",
    frequencyType: "annual",
    frequencyDays: 365,
    lastPmDate: daysAgo(340),
    nextDueDate: daysFromNow(25),
    estimatedDurationHours: "8.0",
    criticalityRating: "high",
    maintenanceType: "preventive",
    isKeyProductionEquipment: false,
    breakdownImpact: "Fouled or failed heat exchanger reduces batch temperature control precision, extends cycle times ~30%, and may cause batch temperature spec failures.",
    contingencyPlan: "Extend batch cycle time to compensate for reduced heat transfer. Notify Quality if batch temperatures cannot be achieved within extended time window.",
    sparePartsInventory: "Gasket set (full face, PN GRM-GSK-ST400) x2; Tube plugs (brass, 3/4\") x20. Location: Maintenance Room, Shelf E.",
    oeeTarget: null,
    installDate: "2016-04-10",
    warrantyExpiry: "2019-04-10",
    maintenanceContractor: "Graham Corporation Field Service",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "ANNUAL PM:\n1. Isolate and drain both shell and tube sides per SOP EQP-019\n2. Chemical clean tube bundle (per cleaning SOP PRD-041)\n3. High-pressure water lance tube interior (3,000 psi)\n4. Inspect tube ends for pitting, corrosion, and fouling — plug any leaking tubes\n5. Inspect shell-side baffles and inlet nozzles\n6. Replace all gaskets\n7. Pressure test at 1.5x operating pressure\n8. Record before/after tube fouling photos for trend analysis",
    status: "active",
    notes: "Fouling trend data available from process DCS. HX-101 historical ΔT trend in Engineering folder.",
  },
  {
    equipmentId: "PM-010",
    name: "Drum / Tote Conveyor System — Receiving Dock",
    type: "Conveyor Belt",
    manufacturer: "Hytrol",
    model: "190-BF",
    serialNumber: "HYT-190BF-2021-0099",
    location: "Receiving Dock — Bay 3 & 4",
    department: "Receiving / Warehousing",
    responsiblePerson: "Luis Hernandez",
    responsibleEmail: "lhernandez@ccichemical.com",
    frequencyType: "monthly",
    frequencyDays: 30,
    lastPmDate: daysAgo(20),
    nextDueDate: daysFromNow(10),
    estimatedDurationHours: "1.5",
    criticalityRating: "medium",
    maintenanceType: "preventive",
    isKeyProductionEquipment: false,
    breakdownImpact: "Conveyor failure slows raw material receiving by ~80%. Manual drum handling significantly increases ergonomic injury risk. Fork truck required as temporary workaround.",
    contingencyPlan: "Manual pallet jack and fork truck operation. Brief all receiving staff on manual handling SOP EHS-012. Ergonomic risk assessment required.",
    sparePartsInventory: "Drive belt x2; Motor sheave x1; Roller bearings (6205-2RS) x6. Location: Receiving Maintenance Cabinet.",
    oeeTarget: null,
    installDate: "2021-09-15",
    warrantyExpiry: "2024-09-15",
    maintenanceContractor: null,
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "MONTHLY PM:\n1. LOTO per CCI-LOTO-015\n2. Inspect belt for wear, fraying, and tracking alignment\n3. Lubricate all roller bearings\n4. Check and adjust belt tension (belt deflection ½\" mid-span)\n5. Inspect drive motor for abnormal noise or heat\n6. Check all guards and safety covers are in place\n7. Test emergency stop e-stops at all stations\n8. Run loaded conveyor test",
    status: "active",
  },
  {
    equipmentId: "PM-011",
    name: "Boiler — Steam Generation Unit",
    type: "Boiler / Heater",
    manufacturer: "Cleaver-Brooks",
    model: "CB-LE-100",
    serialNumber: "CB-2017-LE100-9901",
    location: "Boiler Room — Utility Wing",
    department: "Facilities / Maintenance",
    responsiblePerson: "Carlos Rivera",
    responsibleEmail: "crivera@ccichemical.com",
    frequencyType: "monthly",
    frequencyDays: 30,
    lastPmDate: daysAgo(28),
    nextDueDate: daysFromNow(2),   // Due soon
    estimatedDurationHours: "2.5",
    criticalityRating: "critical",
    maintenanceType: "preventive",
    isKeyProductionEquipment: false,
    breakdownImpact: "Steam loss halts all steam-heated reactors and heat exchangers. Production shutdown within 2 hours. Heating unavailable for building during winter months.",
    contingencyPlan: "Rental boiler (Clayton Industries) available on 24-hour notice. Natural gas supply continuity confirmed. Safety team notified immediately on any boiler shutdown.",
    sparePartsInventory: "Water probe assembly x1; Low-water cutoff sensor x1; Burner igniter x2; Flame rod x1. Location: Boiler Room Storage Cabinet.",
    oeeTarget: null,
    installDate: "2017-10-01",
    warrantyExpiry: "2020-10-01",
    maintenanceContractor: "Cleaver-Brooks Service — Boiler Inspection License #BIL-2024-0871",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "MONTHLY PM (State-licensed boiler inspector may observe annually):\n1. Perform water quality check (TDS, pH, alkalinity, hardness)\n2. Blowdown bottom and surface blow per SOP UTL-008\n3. Check and clean strainer on feedwater pump\n4. Inspect sight glass — clean if cloudy\n5. Test low-water cutoffs (manual test both primary and auxiliary)\n6. Inspect burner flame and pilot — clean electrodes if needed\n7. Check all safety valves for leaks (do NOT lift unless annual test)\n8. Log operating pressure, temperature, fuel consumption, water quality readings",
    status: "active",
    notes: "Annual boiler inspection due 2025-10-01. Contact state inspector 90 days in advance. Boiler operator license required — Carlos Rivera (License #BOL-OH-9271).",
  },
  {
    equipmentId: "PM-012",
    name: "Drum Labeling Machine",
    type: "Printing / Marking Machine",
    manufacturer: "Markem-Imaje",
    model: "9450",
    serialNumber: "MKI-9450-2022-3341",
    location: "Packaging Hall — Label Station",
    department: "Packaging",
    responsiblePerson: "Ana Gutierrez",
    responsibleEmail: "agutierrez@ccichemical.com",
    frequencyType: "monthly",
    frequencyDays: 30,
    lastPmDate: daysAgo(18),
    nextDueDate: daysFromNow(12),
    estimatedDurationHours: "1.0",
    criticalityRating: "medium",
    maintenanceType: "preventive",
    isKeyProductionEquipment: false,
    breakdownImpact: "Labeler downtime requires manual label application — error-prone and slow. Risk of GHS/SDS compliance label errors on hazardous material shipments.",
    contingencyPlan: "Manual GHS label station (pre-printed labels + applicator brushes). QC must verify each manually-labeled drum. SOP PKG-014.",
    sparePartsInventory: "Print head (PN MKI-PH9450) x1; Ink cartridge (black) x3; Cleaning kit x2. Location: Packaging Maintenance Drawer.",
    oeeTarget: null,
    installDate: "2022-01-10",
    warrantyExpiry: "2024-01-10",
    maintenanceContractor: "Markem-Imaje Technical Service",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "MONTHLY PM:\n1. Clean print head with Markem-Imaje approved cleaning solution\n2. Check ink level and replace cartridge if < 20%\n3. Inspect and clean ink delivery system\n4. Print test label and verify all GHS/SDS fields are legible and correctly placed\n5. Calibrate label position (± 2mm tolerance)\n6. Check electrical connections and cable routing\n7. Clean exterior and label guide tracks",
    status: "active",
  },
  {
    equipmentId: "PM-013",
    name: "Forklift — Electric, 5-Ton (Unit #2)",
    type: "Forklift / Lift Truck",
    manufacturer: "Toyota",
    model: "8FBMT25",
    serialNumber: "TYT-8FBM-2020-7781",
    location: "Warehouse / Production Floor (mobile)",
    department: "Warehousing / Logistics",
    responsiblePerson: "Luis Hernandez",
    responsibleEmail: "lhernandez@ccichemical.com",
    frequencyType: "quarterly",
    frequencyDays: 90,
    lastPmDate: daysAgo(75),
    nextDueDate: daysFromNow(15),
    estimatedDurationHours: "2.0",
    criticalityRating: "medium",
    maintenanceType: "preventive",
    isKeyProductionEquipment: false,
    breakdownImpact: "Forklift #2 out of service reduces material handling capacity by 50%. Extended lead times for raw material staging and finished goods shipment.",
    contingencyPlan: "Forklift #1 covers critical moves. Manual hand truck and pallet jack for lighter loads. Request rental unit from Crown Lift Trucks if > 1 day outage.",
    sparePartsInventory: "Battery water (distilled) 5-gal; Fork tine pads x4; Horn button x1. Location: Battery Charging Station Cabinet.",
    oeeTarget: null,
    installDate: "2020-05-18",
    warrantyExpiry: "2023-05-18",
    maintenanceContractor: "Toyota Material Handling — Ohio Service Branch",
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "QUARTERLY PM:\n1. Full battery watering and charge level check\n2. Inspect forks for cracks, bends, and tine heel wear (> 10% = replace)\n3. Check tire condition and pressure (solid tires — inspect for chunking)\n4. Test all lights, horn, and backup alarm\n5. Inspect hydraulic fluid level and cylinder seals\n6. Check steering and brake function\n7. Inspect mast chain lubrication and chain stretch\n8. Test load backrest and overhead guard integrity\n9. Record hours, battery specific gravity, and any deficiencies found",
    status: "active",
    notes: "Annual OSHA inspection required. Current certificate valid through 2025-05-18. Operator certified: Luis Hernandez, Pedro Garza.",
  },
  {
    equipmentId: "PM-014",
    name: "pH / Conductivity Monitoring System — Process Line",
    type: "Analytical Instrument",
    manufacturer: "Endress+Hauser",
    model: "Liquiline CM444",
    serialNumber: "EH-CM444-2021-5598",
    location: "Process Line C — Inline",
    department: "Quality / Laboratory",
    responsiblePerson: "Dr. Sofia Reyes",
    responsibleEmail: "sreyes@ccichemical.com",
    frequencyType: "monthly",
    frequencyDays: 30,
    lastPmDate: daysAgo(30),
    nextDueDate: daysFromNow(0),   // Due today
    estimatedDurationHours: "1.0",
    criticalityRating: "high",
    maintenanceType: "condition_based",
    isKeyProductionEquipment: true,
    breakdownImpact: "Loss of inline pH monitoring requires manual grab-sample testing every 30 min. Reduced process visibility increases risk of out-of-spec batches going undetected.",
    contingencyPlan: "Revert to manual pH/conductivity grab sampling per SOP QC-019. Increase sampling frequency to every 30 min. Notify QC supervisor.",
    sparePartsInventory: "pH electrode (PN EH-CPF81D) x2; Conductivity electrode (PN EH-CLS15D) x2; Reference junction x2; Calibration buffer solutions (pH 4, 7, 10). Location: QC Lab Cabinet Q-3.",
    oeeTarget: null,
    installDate: "2021-07-22",
    warrantyExpiry: "2023-07-22",
    maintenanceContractor: "Endress+Hauser Customer Care",
    fodRisk: false,
    validationRequired: true,
    validationStatus: "validated",
    validationDate: "2024-11-15",
    procedureNotes: "MONTHLY PM / CALIBRATION:\n1. Inspect pH electrode reference junction — refill if depleted\n2. Clean electrode tip with soft cloth and DI water\n3. Two-point calibration: pH 7.00 buffer (10 min stabilize), then pH 4.00 buffer\n4. Record slope (%): acceptable range 95–105%. Replace electrode if slope < 90%\n5. Two-point conductivity calibration using traceable standards\n6. Verify temperature compensation is functioning (±0.5°C vs. reference thermometer)\n7. Clean flow cell and process fitting\n8. Record all calibration data in Calibration Log (linked to CAL-REG, Gage CL-009)",
    status: "active",
    notes: "ISO 13485 §6.3 validation — instrument used in product quality monitoring. Calibration is also recorded in the Calibration Module (Gage CL-009). Cross-reference for audit trail.",
  },
  {
    equipmentId: "PM-015",
    name: "Drum Wash Station — Automated",
    type: "Other",
    manufacturer: "Gamajet",
    model: "GJ-8",
    serialNumber: "GAM-GJ8-2022-1101",
    location: "Drum Wash Area — Building C",
    department: "EHS / Operations",
    responsiblePerson: "Ana Gutierrez",
    responsibleEmail: "agutierrez@ccichemical.com",
    frequencyType: "quarterly",
    frequencyDays: 90,
    lastPmDate: daysAgo(50),
    nextDueDate: daysFromNow(40),
    estimatedDurationHours: "1.5",
    criticalityRating: "low",
    maintenanceType: "preventive",
    isKeyProductionEquipment: false,
    breakdownImpact: "Manual drum washing required — significantly slower and increases operator chemical exposure risk. OSHA and EPA compliance must be maintained during manual operations.",
    contingencyPlan: "Manual washing per SOP EHS-025 with required PPE. Increase ventilation in drum wash area.",
    sparePartsInventory: "Nozzle assembly (PN GAM-NZL-GJ8) x2; Spray head bearing x1. Location: Building C Maintenance Closet.",
    oeeTarget: null,
    installDate: "2022-03-01",
    warrantyExpiry: "2024-03-01",
    maintenanceContractor: null,
    fodRisk: false,
    validationRequired: false,
    procedureNotes: "QUARTERLY PM:\n1. Inspect rotating spray nozzle for wear and free rotation\n2. Flush system with clean water — check for leaks\n3. Clean strainer screen on inlet line\n4. Check flow rate vs. specification (min 8 GPM)\n5. Inspect all hose connections and fittings\n6. Verify drain valve operation\n7. Test emergency shutoff",
    status: "active",
  },
];

// ─── PM Records ───────────────────────────────────────────────────────────────
// Keyed by equipmentId (temp key) — filled in after equipment insert

type RecordTemplate = {
  equipId: string;
  pmDate: string;
  performedBy: string;
  result: string;
  laborHours?: string;
  downtimeHours?: string;
  workOrderNumber?: string;
  technicianCertification?: string;
  partsReplaced?: string;
  sparesCost?: string;
  findings?: string;
  rootCause?: string;
  correctiveAction?: string;
  nextDueDate: string;
  safetyCheckPassed?: boolean;
  fodCheckCompleted?: boolean;
  equipmentValidatedPostPm?: boolean;
  notes?: string;
};

const PM_RECORDS: RecordTemplate[] = [
  // PM-001 Air Compressor
  { equipId: "PM-001", pmDate: daysAgo(12), performedBy: "Carlos Rivera", result: "completed", laborHours: "2.0", workOrderNumber: "WO-2025-0841", technicianCertification: "Ingersoll Rand Certified", partsReplaced: "Oil filter PN IR-39868271", sparesCost: "42.00", findings: "Oil filter heavily loaded. Compressor pressure normal at 125 psi. Drive belts in good condition.", nextDueDate: daysFromNow(18), safetyCheckPassed: true, notes: "Outlet air temp 185°F — within normal range." },
  { equipId: "PM-001", pmDate: daysAgo(42), performedBy: "Carlos Rivera", result: "completed", laborHours: "2.5", workOrderNumber: "WO-2025-0619", partsReplaced: "Oil filter + inlet filter", sparesCost: "68.00", findings: "Inlet filter plugged at 65% — cleaned and replaced. Oil/air separator DP: 8 psi (OK). Belt tension adjusted on B-drive.", nextDueDate: daysAgo(12), safetyCheckPassed: true },
  { equipId: "PM-001", pmDate: daysAgo(72), performedBy: "Carlos Rivera", result: "completed", laborHours: "3.0", workOrderNumber: "WO-2025-0401", partsReplaced: "Oil filter; Oil/air separator", sparesCost: "215.00", findings: "Oil/air separator DP reached 17 psi — replaced. Oil sample collected for analysis.", nextDueDate: daysAgo(42), safetyCheckPassed: true, notes: "Oil analysis report expected from TotalCare Lab within 5 business days." },
  { equipId: "PM-001", pmDate: daysAgo(102), performedBy: "External — IR Service", result: "completed", laborHours: "4.5", workOrderNumber: "WO-2025-0187", partsReplaced: "Drive belt set; Oil filter; Inlet filter; Separator", sparesCost: "380.00", findings: "Annual tune-up. Drive belts replaced (showing glazing). All pressures and temps within spec. Annual service completed.", nextDueDate: daysAgo(72), safetyCheckPassed: true, notes: "Next major service at 12,000 hours (approx. 2026-09)" },

  // PM-002 Chiller — 1 record, OVERDUE
  { equipId: "PM-002", pmDate: daysAgo(95), performedBy: "Trane Service Tech — G. Carter", result: "completed", laborHours: "4.0", workOrderNumber: "WO-2024-2234", technicianCertification: "EPA 608 Universal", partsReplaced: "Filter drier", sparesCost: "185.00", findings: "Refrigerant R-410A charge at spec. Condenser coils moderately fouled — cleaned. Filter drier moisture indicator was yellow — replaced. Evaporator DT: 8°F (good).", nextDueDate: daysFromNow(-5), safetyCheckPassed: true, notes: "NEXT PM OVERDUE — schedule immediately. Last performed 3/19/2025." },
  { equipId: "PM-002", pmDate: daysAgo(185), performedBy: "Trane Service Tech — G. Carter", result: "completed", laborHours: "5.0", workOrderNumber: "WO-2024-1150", technicianCertification: "EPA 608 Universal", partsReplaced: "Condenser fan bearing", sparesCost: "310.00", findings: "Condenser fan #2 bearing showing noise — replaced. Refrigerant charge OK. Coil cleaning completed. Controls calibrated.", nextDueDate: daysAgo(95), safetyCheckPassed: true },

  // PM-003 Mixer — upcoming, 2 recent records
  { equipId: "PM-003", pmDate: daysAgo(28), performedBy: "Jose Morales", result: "completed", laborHours: "1.5", workOrderNumber: "WO-2025-0834", partsReplaced: "Grease (4 oz Shell Gadus S2)", sparesCost: "8.00", findings: "Seal visually OK — no weeping. Motor megger: 380 MΩ (good). All bolts torqued. RPM at 100% load: 95 (spec 92-98).", nextDueDate: daysFromNow(2), safetyCheckPassed: true },
  { equipId: "PM-003", pmDate: daysAgo(58), performedBy: "Jose Morales", result: "needs_attention", laborHours: "2.0", downtimeHours: "1.5", workOrderNumber: "WO-2025-0599", partsReplaced: "Mechanical seal assembly", sparesCost: "425.00", findings: "Mechanical seal weeping — slight product traces on shaft. Replaced seal kit. Motor current slightly elevated at 12.3A (spec 12.0A max).", rootCause: "Normal seal wear at ~14 months of service. Seal life consistent with manufacturer expectations for this product.", correctiveAction: "Replace seal per schedule. Monitor motor current at next PM — if > 12.5A, conduct bearing inspection.", nextDueDate: daysAgo(28), safetyCheckPassed: true, notes: "Seal replacement documented in Equipment History file EQP-RX1-003." },
  { equipId: "PM-003", pmDate: daysAgo(88), performedBy: "Jose Morales", result: "completed", laborHours: "1.5", workOrderNumber: "WO-2025-0343", findings: "All OK. Grease points serviced. Seal dry. No anomalies.", nextDueDate: daysAgo(58), safetyCheckPassed: true },

  // PM-004 Dosing Pump — OVERDUE
  { equipId: "PM-004", pmDate: daysAgo(65), performedBy: "Jose Morales", result: "completed", laborHours: "1.0", workOrderNumber: "WO-2025-0501", partsReplaced: "Diaphragm PN PRO-DPH-020", sparesCost: "87.00", findings: "Old diaphragm showing slight stress marks — replaced preventively. Calibration check: 1002 ml / 1000 strokes (0.2% error — within spec).", nextDueDate: daysAgo(35), safetyCheckPassed: true },
  { equipId: "PM-004", pmDate: daysAgo(95), performedBy: "Jose Morales", result: "completed", laborHours: "1.0", workOrderNumber: "WO-2025-0218", findings: "Diaphragm intact. Calibration: 998 ml / 1000 strokes. All valves seating well.", nextDueDate: daysAgo(65), safetyCheckPassed: true },

  // PM-005 Filling Machine — weekly
  { equipId: "PM-005", pmDate: daysAgo(5), performedBy: "Ana Gutierrez", result: "completed", laborHours: "0.8", workOrderNumber: "WO-2025-0898", findings: "O-rings OK. Fill volume: 10.02L, 10.01L, 10.01L (spec 10.0 ± 0.1L ✓). Capper torque 17 in-lb (OK). All lube points serviced.", nextDueDate: daysFromNow(2), safetyCheckPassed: true },
  { equipId: "PM-005", pmDate: daysAgo(12), performedBy: "Ana Gutierrez", result: "completed", laborHours: "1.0", workOrderNumber: "WO-2025-0851", partsReplaced: "2x fill nozzle O-rings (station 3 & 7)", sparesCost: "12.00", findings: "Nozzle #3 and #7 O-rings cracked — replaced. Fill volume calibration after replacement: all 3 test fills within 0.1L spec.", nextDueDate: daysAgo(5), safetyCheckPassed: true },
  { equipId: "PM-005", pmDate: daysAgo(19), performedBy: "Ana Gutierrez", result: "completed", laborHours: "0.8", workOrderNumber: "WO-2025-0802", findings: "All OK. No defects. Fill volume on spec. Belt tension good.", nextDueDate: daysAgo(12), safetyCheckPassed: true },

  // PM-006 HVAC
  { equipId: "PM-006", pmDate: daysAgo(22), performedBy: "Carrier Service — R. Johnson", result: "completed", laborHours: "3.5", workOrderNumber: "WO-2025-0782", technicianCertification: "EPA 608 Universal; NATE Certified", partsReplaced: "3x MERV-13 filters 24x24x2; Drive belt A-58", sparesCost: "145.00", findings: "Drive belt showing glazing — replaced. Filters loaded at ~60% of service life, replaced per schedule. Coil moderately fouled — cleaned. Refrigerant charge OK. Supply air temp: 62°F (spec 60-65°F ✓).", nextDueDate: daysFromNow(68), safetyCheckPassed: true },
  { equipId: "PM-006", pmDate: daysAgo(112), performedBy: "Carrier Service — R. Johnson", result: "completed", laborHours: "4.0", workOrderNumber: "WO-2025-0339", partsReplaced: "6x MERV-13 filters; Condensate pan treatment tablets x3", sparesCost: "122.00", findings: "Annual coil cleaning completed. Condensate drain had moderate algae — treated and flushed. Thermostat calibration: within 0.5°F. All systems operational.", nextDueDate: daysAgo(22), safetyCheckPassed: true },

  // PM-007 Vacuum Unit
  { equipId: "PM-007", pmDate: daysAgo(60), performedBy: "Maria Santos", result: "completed", laborHours: "3.0", workOrderNumber: "WO-2025-0581", technicianCertification: "Busch Service Trained", partsReplaced: "Pump oil (2x 5L Busch VM100); Inlet filter; Exhaust filter", sparesCost: "285.00", findings: "Oil was dark and slightly contaminated. Replaced per schedule. Ultimate vacuum achieved: 0.35 mbar (spec < 0.5 mbar ✓). No leaks detected.", nextDueDate: daysFromNow(30), safetyCheckPassed: true },
  { equipId: "PM-007", pmDate: daysAgo(150), performedBy: "Busch Service — E. Tovar", result: "completed", laborHours: "4.0", workOrderNumber: "WO-2024-2102", partsReplaced: "Oil separator + full filter set", sparesCost: "520.00", findings: "Oil separator showed carryover — replaced. Oil separator exhaust filter saturated. Vacuum achieved 0.28 mbar after service.", nextDueDate: daysAgo(60), safetyCheckPassed: true },

  // PM-008 Centrifuge — OVERDUE
  { equipId: "PM-008", pmDate: daysAgo(185), performedBy: "Alfa Laval Service — T. McCoy", result: "completed", laborHours: "6.0", workOrderNumber: "WO-2024-1889", technicianCertification: "Alfa Laval Certified Service Engineer", partsReplaced: "Main spindle bearing set; Bowl gasket set; Disc stack O-rings", sparesCost: "2450.00", findings: "Bearings worn at 85% life — replaced. Disc stack in good condition — no erosion. Post-assembly vibration: 1.8 mm/s (spec < 2.5 ✓). Separation efficiency test passed.", nextDueDate: daysFromNow(-5), safetyCheckPassed: true, notes: "NEXT PM OVERDUE. Vibration slightly elevated over past 2 weeks — DCS trend data indicates 2.1 mm/s. Schedule immediately." },
  { equipId: "PM-008", pmDate: daysAgo(365), performedBy: "Alfa Laval Service — T. McCoy", result: "needs_attention", laborHours: "8.0", downtimeHours: "12.0", workOrderNumber: "WO-2024-0421", partsReplaced: "Main spindle bearing; Bowl gasket; Frame bearing", sparesCost: "3100.00", findings: "Bowl showing minor pitting on inlet side — within acceptable limits (max pit depth < 0.5mm). Frame bearing worn — replaced. Post-service vibration 2.0 mm/s.", rootCause: "Normal wear and erosion from abrasive process fluid. Expected for this duty.", correctiveAction: "Increase bowl inspection frequency at next PM. Evaluate anti-erosion disc coating with Alfa Laval engineering.", nextDueDate: daysAgo(185), safetyCheckPassed: true },

  // PM-009 Heat Exchanger
  { equipId: "PM-009", pmDate: daysAgo(340), performedBy: "Graham Service — J. Watkins", result: "completed", laborHours: "8.0", workOrderNumber: "WO-2024-0812", technicianCertification: "ASME Certified Pressure Vessel Inspector", partsReplaced: "Full gasket set", sparesCost: "340.00", findings: "Tube bundle: 3 tubes plugged (carry-forward from 2023). Fouling moderate — chemical clean effective. Pressure test at 150 psi — no leaks. ΔT performance restored to spec.", nextDueDate: daysFromNow(25), safetyCheckPassed: true, notes: "Tube plugging count now at 3. When count reaches 10, evaluate retube." },

  // PM-010 Conveyor
  { equipId: "PM-010", pmDate: daysAgo(20), performedBy: "Luis Hernandez", result: "completed", laborHours: "1.5", workOrderNumber: "WO-2025-0818", findings: "Belt tracking within 1/4\" of center — OK. All bearings lubricated. Belt tension OK. E-stops tested — all functional. No defects noted.", nextDueDate: daysFromNow(10), safetyCheckPassed: true },
  { equipId: "PM-010", pmDate: daysAgo(50), performedBy: "Luis Hernandez", result: "completed", laborHours: "2.0", workOrderNumber: "WO-2025-0568", partsReplaced: "2x roller bearings (6205-2RS)", sparesCost: "28.00", findings: "Roller #7 (take-up end) bearing noisy — replaced. Belt tracking adjusted. All other bearings OK.", nextDueDate: daysAgo(20), safetyCheckPassed: true },

  // PM-011 Boiler — upcoming
  { equipId: "PM-011", pmDate: daysAgo(28), performedBy: "Carlos Rivera", result: "completed", laborHours: "2.5", workOrderNumber: "WO-2025-0836", findings: "Water TDS: 320 ppm (limit 500 ✓). pH 10.8 (spec 10.5–11.2 ✓). Blowdown completed. Low-water cutoff tested OK. Burner flame stable — no adjustment needed. Safety valves no leaks.", nextDueDate: daysFromNow(2), safetyCheckPassed: true, notes: "Boiler operating at 90% efficiency per stack analyzer. Chemical treatment dosing on target." },
  { equipId: "PM-011", pmDate: daysAgo(58), performedBy: "Carlos Rivera", result: "completed", laborHours: "2.5", workOrderNumber: "WO-2025-0601", findings: "All within spec. Replaced worn igniter electrode (early replacement — showing erosion).", partsReplaced: "Igniter electrode x1", sparesCost: "38.00", nextDueDate: daysAgo(28), safetyCheckPassed: true },
  { equipId: "PM-011", pmDate: daysAgo(88), performedBy: "Carlos Rivera", result: "completed", laborHours: "2.0", workOrderNumber: "WO-2025-0401", findings: "Water chemistry in spec. Low-water cutoffs functional. Sight glass cleaned — slightly hazy.", nextDueDate: daysAgo(58), safetyCheckPassed: true },

  // PM-012 Labeler
  { equipId: "PM-012", pmDate: daysAgo(18), performedBy: "Ana Gutierrez", result: "completed", laborHours: "1.0", workOrderNumber: "WO-2025-0812", findings: "Print head cleaned. Label position within 1mm tolerance. GHS test label printed — all fields verified. Ink level 60%.", nextDueDate: daysFromNow(12), safetyCheckPassed: false, notes: "This machine does not require LOTO for PM — electrical disconnect only." },

  // PM-013 Forklift
  { equipId: "PM-013", pmDate: daysAgo(75), performedBy: "Toyota Material Handling — D. Park", result: "completed", laborHours: "2.0", workOrderNumber: "WO-2025-0592", technicianCertification: "Toyota Certified Forklift Technician", partsReplaced: "Hydraulic fluid top-up (1 gal)", sparesCost: "22.00", findings: "Battery SG: 1.265 (good). Fork tine wear within limits (15% heel wear). Tires sound. All lights, horn, backup alarm functional. Brakes OK. Mast chain: 3% stretch (limit 3% — replace recommended at next PM).", correctiveAction: "Order mast chain replacement for next quarterly PM (PN TYT-MCH-8FBM25). ETA 2 weeks.", nextDueDate: daysFromNow(15), safetyCheckPassed: true },
  { equipId: "PM-013", pmDate: daysAgo(165), performedBy: "Toyota Material Handling — D. Park", result: "completed", laborHours: "2.0", workOrderNumber: "WO-2025-0031", findings: "All checks normal. Battery in good condition. Chain stretch 2.8%. No issues identified.", nextDueDate: daysAgo(75), safetyCheckPassed: true },

  // PM-014 pH/Conductivity Monitor
  { equipId: "PM-014", pmDate: daysAgo(30), performedBy: "Dr. Sofia Reyes", result: "completed", laborHours: "1.0", workOrderNumber: "WO-2025-0801", technicianCertification: "Endress+Hauser Certified User", findings: "pH calibration slope: 98.2% (spec 95–105% ✓). pH 7.00 buffer: 7.01 (offset 0.01 — adjusted). Conductivity calibration within 0.5% of standard. Temperature compensation ±0.3°C vs. reference.", nextDueDate: daysFromNow(0), safetyCheckPassed: false, equipmentValidatedPostPm: true, notes: "Calibration certificate issued. Results logged in CAL-REG-2025-0801. Cross-reference Calibration Module Gage CL-009." },
  { equipId: "PM-014", pmDate: daysAgo(60), performedBy: "Dr. Sofia Reyes", result: "needs_attention", laborHours: "1.5", workOrderNumber: "WO-2025-0581", partsReplaced: "pH electrode PN EH-CPF81D", sparesCost: "165.00", findings: "pH electrode slope degraded to 87% — below 90% threshold. Replaced electrode. Post-replacement slope: 102.1%. Conductivity: OK.", rootCause: "Electrode fouling from process fluid — shortened service life in this application (expected every 45-60 days vs. manufacturer 90-day spec).", correctiveAction: "Reduce electrode replacement interval to 45-day maximum for this process stream. Evaluate gel-filled electrode for improved fouling resistance.", nextDueDate: daysAgo(30), safetyCheckPassed: false, equipmentValidatedPostPm: true },
  { equipId: "PM-014", pmDate: daysAgo(90), performedBy: "Dr. Sofia Reyes", result: "completed", laborHours: "1.0", workOrderNumber: "WO-2025-0332", findings: "Slope: 97.5% (OK). All calibrations within spec. Reference junction refilled.", nextDueDate: daysAgo(60), safetyCheckPassed: false, equipmentValidatedPostPm: true },

  // PM-015 Drum Washer
  { equipId: "PM-015", pmDate: daysAgo(50), performedBy: "Ana Gutierrez", result: "completed", laborHours: "1.0", workOrderNumber: "WO-2025-0612", findings: "Nozzle rotating freely. Flow rate measured: 9.2 GPM (spec ≥ 8.0 ✓). Strainer screen clean. All connections dry.", nextDueDate: daysFromNow(40), safetyCheckPassed: true },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== CCI Chemical PM Seed Script ===");
  console.log(`Project ID: ${PROJECT_ID} | User ID: ${USER_ID}`);

  // Clear existing data for this project
  console.log("\nClearing existing PM data for project 4…");
  const existing = await db.select().from(pmEquipment)
    .where(eq(pmEquipment.isoProjectId, PROJECT_ID));
  for (const eq_ of existing) {
    await db.delete(pmRecords).where(eq(pmRecords.equipmentId, eq_.id));
  }
  await db.delete(pmEquipment).where(eq(pmEquipment.isoProjectId, PROJECT_ID));
  console.log("  Cleared.");

  // Insert equipment and build ID map
  console.log("\nInserting equipment…");
  const idMap: Record<string, number> = {};

  for (const e of EQUIPMENT) {
    const [inserted] = await db.insert(pmEquipment).values({
      userId:        USER_ID,
      isoProjectId:  PROJECT_ID,
      equipmentId:   e.equipmentId,
      name:          e.name,
      type:          e.type ?? null,
      manufacturer:  e.manufacturer ?? null,
      model:         e.model ?? null,
      serialNumber:  e.serialNumber ?? null,
      location:      e.location ?? null,
      department:    e.department ?? null,
      responsiblePerson:  e.responsiblePerson ?? null,
      responsibleEmail:   e.responsibleEmail ?? null,
      frequencyType: e.frequencyType,
      frequencyDays: e.frequencyDays,
      lastPmDate:    e.lastPmDate ?? null,
      nextDueDate:   e.nextDueDate ?? null,
      estimatedDurationHours: e.estimatedDurationHours ?? null,
      criticalityRating:      e.criticalityRating ?? "medium",
      maintenanceType:        e.maintenanceType ?? "preventive",
      isKeyProductionEquipment: e.isKeyProductionEquipment ?? false,
      breakdownImpact:   e.breakdownImpact ?? null,
      contingencyPlan:   e.contingencyPlan ?? null,
      sparePartsInventory: e.sparePartsInventory ?? null,
      oeeTarget:           e.oeeTarget ?? null,
      fodRisk:             e.fodRisk ?? false,
      validationRequired:  e.validationRequired ?? false,
      validationStatus:    (e as any).validationStatus ?? null,
      validationDate:      (e as any).validationDate ?? null,
      installDate:         e.installDate ?? null,
      warrantyExpiry:      e.warrantyExpiry ?? null,
      maintenanceContractor: e.maintenanceContractor ?? null,
      procedureNotes:   e.procedureNotes ?? null,
      status:           e.status ?? "active",
      notes:            (e as any).notes ?? null,
    }).returning();
    idMap[e.equipmentId] = inserted.id;
    console.log(`  ✓ ${e.equipmentId} — ${e.name}`);
  }

  // Insert PM records
  console.log("\nInserting PM records…");
  let recCount = 0;
  for (const r of PM_RECORDS) {
    const equipmentId = idMap[r.equipId];
    if (!equipmentId) {
      console.warn(`  WARNING: no ID for ${r.equipId} — skipping`);
      continue;
    }
    await db.insert(pmRecords).values({
      userId:        USER_ID,
      isoProjectId:  PROJECT_ID,
      equipmentId,
      pmDate:        r.pmDate,
      performedBy:   r.performedBy ?? null,
      result:        r.result ?? "completed",
      laborHours:    r.laborHours ?? null,
      downtimeHours: r.downtimeHours ?? null,
      workOrderNumber: r.workOrderNumber ?? null,
      technicianCertification: r.technicianCertification ?? null,
      partsReplaced: r.partsReplaced ?? null,
      sparesCost:    r.sparesCost ?? null,
      findings:      r.findings ?? null,
      rootCause:     r.rootCause ?? null,
      correctiveAction: r.correctiveAction ?? null,
      nextDueDate:   r.nextDueDate,
      safetyCheckPassed: r.safetyCheckPassed ?? null,
      fodCheckCompleted: r.fodCheckCompleted ?? null,
      equipmentValidatedPostPm: r.equipmentValidatedPostPm ?? null,
      notes:         r.notes ?? null,
    });
    recCount++;
  }
  console.log(`  ✓ ${recCount} PM records inserted.`);

  console.log("\n=== Seed complete ===");
  console.log(`Equipment: ${EQUIPMENT.length} items`);
  console.log(`PM Records: ${recCount}`);
  const overdueList = EQUIPMENT.filter(e => {
    const d = new Date(e.nextDueDate ?? "9999").getTime() - Date.now();
    return d < 0;
  });
  console.log(`Overdue equipment: ${overdueList.map(e => e.equipmentId).join(", ")}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
