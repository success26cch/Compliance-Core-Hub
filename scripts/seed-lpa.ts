/**
 * Seed script: CCI Chemical LPA (Layered Process Audit) demo data
 * Run: npx tsx scripts/seed-lpa.ts
 */
import { db } from "../server/db";
import { lpaAuditPlans, lpaRecords } from "../shared/schema";
import { eq } from "drizzle-orm";
import type { LpaLayerConfig, LpaQuestion, LpaAuditItem } from "../shared/schema";

const USER_ID = "54320068";

const DEFAULT_QUESTIONS: LpaQuestion[] = [
  { id: "sw-1",  category: "Standard Work",            question: "Is the operator following the standardized work / job instructions?",                            isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sw-2",  category: "Standard Work",            question: "Are the work instructions posted, current (correct revision), and legible at the workstation?", isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sw-3",  category: "Standard Work",            question: "Is the operator performing job tasks in the correct sequence?",                                   isRequired: false, appliesTo: ["L1","L2"] },
  { id: "su-1",  category: "Setup / Authorization",    question: "Was setup signed off by authorized personnel before production began?",                           isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "su-2",  category: "Setup / Authorization",    question: "Is the first-off sample approval on file and available at the workstation?",                     isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "su-3",  category: "Setup / Authorization",    question: "Is the work order / production traveler present, correct, and current?",                         isRequired: false, appliesTo: ["L1","L2"] },
  { id: "cp-1",  category: "Control Plan",             question: "Are all control plan checks being performed at the correct frequency?",                           isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "cp-2",  category: "Control Plan",             question: "Is in-process inspection data being recorded accurately and completely?",                         isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "cp-3",  category: "Control Plan",             question: "Is the operator aware of the reaction plan for out-of-spec conditions?",                         isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "ep-1",  category: "Error Proofing",           question: "Is all error-proofing (poka-yoke) equipment functioning and verified at required frequency?",    isRequired: true,  appliesTo: ["L1","L2","L3","L4"] },
  { id: "ep-2",  category: "Error Proofing",           question: "Is the poka-yoke verification log current and complete?",                                         isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "gm-1",  category: "Gauges & Measurement",    question: "Are measuring devices calibrated (current calibration sticker / record)?",                       isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "gm-2",  category: "Gauges & Measurement",    question: "Are gauges clean, undamaged, and stored correctly when not in use?",                              isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "gm-3",  category: "Gauges & Measurement",    question: "Is the operator using the correct gauge for the characteristic being measured?",                  isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "sf-1",  category: "Safety / PPE",             question: "Is the operator wearing all required personal protective equipment (PPE)?",                       isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sf-2",  category: "Safety / PPE",             question: "Are required safety guards and machine interlocks in place and functional?",                      isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sf-3",  category: "Safety / PPE",             question: "Is the emergency stop accessible and tested per procedure?",                                      isRequired: false, appliesTo: ["L2","L3","L4","L5"] },
  { id: "mc-1",  category: "Material Control",         question: "Is material correctly identified with work order / traveler / label?",                            isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "mc-2",  category: "Material Control",         question: "Is FIFO (First In First Out) being practiced for all materials?",                                isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "mc-3",  category: "Material Control",         question: "Is nonconforming material properly identified, tagged, and segregated?",                          isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "5s-1",  category: "5S / Housekeeping",        question: "Is the workstation clean and free of unnecessary items?",                                         isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "5s-2",  category: "5S / Housekeeping",        question: "Are tools and materials stored in their designated, clearly labeled locations?",                  isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "5s-3",  category: "5S / Housekeeping",        question: "Is the workstation free of safety hazards (tripping, spills, pinch points)?",                   isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "tr-1",  category: "Training & Certification", question: "Is the operator trained and certified / qualified for this operation?",                          isRequired: true,  appliesTo: ["L2","L3","L4","L5"] },
  { id: "tr-2",  category: "Training & Certification", question: "Are training records current, complete, and accessible at the workstation?",                    isRequired: false, appliesTo: ["L2","L3","L4","L5"] },
];

const LAYERS: LpaLayerConfig[] = [
  { layer: "L1", label: "Operator / Team Member",     frequency: "daily",     targetPerPeriod: 5, active: true },
  { layer: "L2", label: "Team Lead / Supervisor",     frequency: "weekly",    targetPerPeriod: 2, active: true },
  { layer: "L3", label: "Manager / Dept. Head",       frequency: "monthly",   targetPerPeriod: 2, active: true },
  { layer: "L4", label: "Plant Manager / Director",   frequency: "monthly",   targetPerPeriod: 1, active: true },
  { layer: "L5", label: "Executive / VP",             frequency: "quarterly", targetPerPeriod: 1, active: false },
];

function makeItems(layer: string, overrides: Record<string, { result: "yes"|"no"|"na"; note?: string }> = {}): LpaAuditItem[] {
  return DEFAULT_QUESTIONS
    .filter(q => q.appliesTo.includes(layer))
    .map(q => ({
      questionId: q.id,
      question: q.question,
      category: q.category,
      layer,
      result: (overrides[q.id]?.result ?? "yes") as "yes"|"no"|"na",
      note: overrides[q.id]?.note ?? "",
    }));
}

async function main() {
  console.log("Seeding LPA plans and records for CCI Chemical…");

  await db.delete(lpaAuditPlans).where(eq(lpaAuditPlans.userId, USER_ID));
  await db.delete(lpaRecords).where(eq(lpaRecords.userId, USER_ID));
  console.log("Cleared existing LPA data.");

  const plans = await db.insert(lpaAuditPlans).values([
    {
      userId: USER_ID,
      processName: "Chemical Blending",
      area: "Blending Bays 1 & 2 — Reactors R-101, R-102",
      partFamily: "Polyurethane Coatings, Solvent Blends",
      status: "active",
      layers: LAYERS,
      questions: DEFAULT_QUESTIONS,
      notes: "High-priority process per GM CSR LPA requirements. Night shift requires elevated L2 frequency.",
    },
    {
      userId: USER_ID,
      processName: "Filling & Packaging",
      area: "Filling Lines 1, 2, 3",
      partFamily: "All finished product lines",
      status: "active",
      layers: LAYERS.map(l => l.layer === "L1" ? { ...l, frequency: "per_shift" as any, targetPerPeriod: 3 } : l),
      questions: DEFAULT_QUESTIONS,
      notes: "Stellantis CSR requires per-shift L1 LPA on all filling lines. Label compliance is key control.",
    },
    {
      userId: USER_ID,
      processName: "Analytical Testing / QC Lab",
      area: "QC Laboratory — All Benches",
      partFamily: "All product families",
      status: "active",
      layers: LAYERS.map(l => ["L1","L5"].includes(l.layer) ? { ...l, active: false } : l),
      questions: DEFAULT_QUESTIONS.filter(q => ["L2","L3","L4"].some(l => q.appliesTo.includes(l))),
      notes: "Lab process audited L2–L4 only. Focus on instrument calibration, analyst certification, and SOP adherence.",
    },
    {
      userId: USER_ID,
      processName: "Warehouse & Receiving",
      area: "Warehouse / Receiving Dock",
      partFamily: "Raw materials, Finished Goods",
      status: "active",
      layers: LAYERS.map(l => ["L4","L5"].includes(l.layer) ? { ...l, frequency: "quarterly" as any, active: l.layer === "L4" } : l),
      questions: DEFAULT_QUESTIONS,
      notes: "Focus on FIFO, HazMat labeling, and inbound receiving inspection per QP-RCV-001.",
    },
  ]).returning();

  console.log(`Inserted ${plans.length} LPA audit plans.`);

  const [blending, filling, lab, warehouse] = plans;

  // ── Records ──────────────────────────────────────────────────────────────
  const records: any[] = [
    // Chemical Blending — multiple layers, recent history
    {
      userId: USER_ID, planId: blending.id,
      processName: "Chemical Blending", area: "Blending Bay 1 — R-101",
      auditDate: "2026-04-25", layer: "L1", layerLabel: "Operator / Team Member",
      auditorName: "Carlos Ruiz, Blending Operator", shift: "Day",
      auditItems: makeItems("L1"),
      conformingCount: 20, nonconformingCount: 0, naCount: 0, result: "pass",
      overallNotes: "All items conforming. Operator demonstrated strong process knowledge. Control plan checks up to date.",
      immediateActions: "", escalated: false, escalatedTo: "",
    },
    {
      userId: USER_ID, planId: blending.id,
      processName: "Chemical Blending", area: "Blending Bay 2 — R-102",
      auditDate: "2026-04-24", layer: "L1", layerLabel: "Operator / Team Member",
      auditorName: "T. Garcia, Temp Operator", shift: "Night",
      auditItems: makeItems("L1", {
        "sw-2": { result: "no", note: "WI-BLEND-005 posted is Rev B; Rev C released 2 weeks ago, not yet distributed to night shift." },
        "tr-1": { result: "no", note: "Operator not certified for CCI-3380 formulation — only CCI-2240 certification on file." },
      }),
      conformingCount: 18, nonconformingCount: 2, naCount: 0, result: "partial",
      overallNotes: "Two nonconformances found on night shift. Operator T. Garcia does not hold CCI-3380 certification. WI revision not distributed.",
      immediateActions: "Operator removed from CCI-3380 process pending certification. WI-BLEND-005 Rev C printout provided temporarily.",
      escalated: true, escalatedTo: "Carlos Mendez, Process Auditor → Production Manager (same night)",
    },
    {
      userId: USER_ID, planId: blending.id,
      processName: "Chemical Blending", area: "Blending Bay 1 — R-101",
      auditDate: "2026-04-22", layer: "L2", layerLabel: "Team Lead / Supervisor",
      auditorName: "Rosa Martinez, Production Supervisor", shift: "Day",
      auditItems: makeItems("L2"),
      conformingCount: 23, nonconformingCount: 0, naCount: 0, result: "pass",
      overallNotes: "Full conformance. Supervisor Rosa confirmed all day-shift operators are CCI-3380 certified. Control plan at workstation.",
      immediateActions: "", escalated: false, escalatedTo: "",
    },
    {
      userId: USER_ID, planId: blending.id,
      processName: "Chemical Blending", area: "Blending Bays 1 & 2",
      auditDate: "2026-04-15", layer: "L3", layerLabel: "Manager / Dept. Head",
      auditorName: "Director of Quality, J. Okonkwo", shift: "Day",
      auditItems: makeItems("L3"),
      conformingCount: 20, nonconformingCount: 0, naCount: 0, result: "pass",
      overallNotes: "Monthly L3 audit. All process controls functioning. CAR-2026-039 closure verified — night shift certification issue resolved.",
      immediateActions: "", escalated: false, escalatedTo: "",
    },
    {
      userId: USER_ID, planId: blending.id,
      processName: "Chemical Blending", area: "Blending Bays 1 & 2",
      auditDate: "2026-04-10", layer: "L4", layerLabel: "Plant Manager / Director",
      auditorName: "VP Operations, M. Delgado", shift: "Day",
      auditItems: makeItems("L4", {
        "5s-1": { result: "no", note: "Blending Bay 2 floor had residue near R-102 — cleanup in progress but not completed before audit." },
      }),
      conformingCount: 13, nonconformingCount: 1, naCount: 0, result: "partial",
      overallNotes: "Plant-level LPA. One 5S finding in Bay 2. Safety and process conformance otherwise strong. Follow-up scheduled for April 14.",
      immediateActions: "Immediate clean-up assigned to area lead. Photographic evidence taken.",
      escalated: false, escalatedTo: "",
    },

    // Filling & Packaging
    {
      userId: USER_ID, planId: filling.id,
      processName: "Filling & Packaging", area: "Filling Line 2",
      auditDate: "2026-04-26", layer: "L1", layerLabel: "Operator / Team Member",
      auditorName: "Ana Torres, Filling Operator", shift: "Day",
      auditItems: makeItems("L1"),
      conformingCount: 20, nonconformingCount: 0, naCount: 0, result: "pass",
      overallNotes: "All conforming. Checkweigher verified, labels confirmed Rev C. Operator followed all steps.",
      immediateActions: "", escalated: false, escalatedTo: "",
    },
    {
      userId: USER_ID, planId: filling.id,
      processName: "Filling & Packaging", area: "Filling Lines 1, 2, 3",
      auditDate: "2026-04-21", layer: "L2", layerLabel: "Team Lead / Supervisor",
      auditorName: "James Okonkwo, Lead QC", shift: "Day",
      auditItems: makeItems("L2", {
        "sw-2": { result: "no", note: "WI-FILL-003 at station 3 is still Rev B; ECN-2026-18 update not yet at that station." },
        "5s-2": { result: "no", note: "Solvent containers at station 3 not in designated storage area — left on floor near line." },
      }),
      conformingCount: 21, nonconformingCount: 2, naCount: 0, result: "partial",
      overallNotes: "Same two findings as CAR-2026-051. Station 3 WI still not updated. 5S deficiency recurring.",
      immediateActions: "5S corrected immediately. WI update escalated to Engineering for expedited action.",
      escalated: true, escalatedTo: "Production Manager — verbal briefing April 21",
    },

    // QC Lab
    {
      userId: USER_ID, planId: lab.id,
      processName: "Analytical Testing / QC Lab", area: "QC Lab — Bench A",
      auditDate: "2026-04-23", layer: "L2", layerLabel: "Team Lead / Supervisor",
      auditorName: "Maria Santos, QC Inspector", shift: "Day",
      auditItems: makeItems("L2"),
      conformingCount: 23, nonconformingCount: 0, naCount: 0, result: "pass",
      overallNotes: "All lab instruments within calibration. Analysts using correct methods. LIMS data verified.",
      immediateActions: "", escalated: false, escalatedTo: "",
    },
    {
      userId: USER_ID, planId: lab.id,
      processName: "Analytical Testing / QC Lab", area: "QC Lab — All Benches",
      auditDate: "2026-04-08", layer: "L3", layerLabel: "Manager / Dept. Head",
      auditorName: "Director of Quality, J. Okonkwo", shift: "Day",
      auditItems: makeItems("L3"),
      conformingCount: 20, nonconformingCount: 0, naCount: 0, result: "pass",
      overallNotes: "Monthly L3 lab audit. Lab meets all IATF §7.1.5.2 requirements for internal calibration laboratory.",
      immediateActions: "", escalated: false, escalatedTo: "",
    },

    // Warehouse
    {
      userId: USER_ID, planId: warehouse.id,
      processName: "Warehouse & Receiving", area: "Receiving Dock",
      auditDate: "2026-04-20", layer: "L1", layerLabel: "Operator / Team Member",
      auditorName: "Luis Perez, Warehouse Lead", shift: "Day",
      auditItems: makeItems("L1", {
        "mc-2": { result: "no", note: "FIFO not practiced in raw material staging area — older drums partially blocked by newer delivery." },
      }),
      conformingCount: 19, nonconformingCount: 1, naCount: 0, result: "partial",
      overallNotes: "One FIFO nonconformance in staging area. Drum arrangement corrected during audit. Photo documented.",
      immediateActions: "Drums re-arranged to FIFO order. Team reminded of FIFO requirements at end-of-shift meeting.",
      escalated: false, escalatedTo: "",
    },
  ];

  const inserted = await db.insert(lpaRecords).values(records).returning();
  console.log(`Inserted ${inserted.length} LPA audit records.`);

  console.log("\n✅ LPA seed complete!");
  console.log(`   - 4 audit plans (Chemical Blending, Filling & Packaging, QC Lab, Warehouse)`);
  console.log(`   - ${inserted.length} audit records across L1–L4`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
