/**
 * Seed script: CCI Chemical, Inc. — Supplier Management sample data
 * Run: npx tsx scripts/seed-cci-suppliers.ts
 *
 * CCI Chemical is a brake fluid (DOT 3/4/5.1) and coolant (EG/PG-based)
 * manufacturer in Dayton, OH, certified to IATF 16949.
 *
 * Project ID : 4   (CCI Chemical IATF 16949 QMS)
 * User ID    : c2df200b-5806-4310-ba66-e127f2095625  (Raul — superadmin)
 */

import { db } from "../server/db";
import {
  suppliers, supplierCriteria, supplierEvaluations, supplierAudits,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

const PROJECT_ID = 4;
const USER_ID = "c2df200b-5806-4310-ba66-e127f2095625";

// ─── Helper ─────────────────────────────────────────────────────────────────

async function clearExisting() {
  const existing = await db.select({ id: suppliers.id }).from(suppliers)
    .where(and(eq(suppliers.userId, USER_ID), eq(suppliers.isoProjectId, PROJECT_ID)));
  if (existing.length === 0) return;
  console.log(`  Clearing ${existing.length} existing supplier records…`);
  const ids = existing.map(r => r.id);
  for (const id of ids) {
    await db.delete(supplierAudits).where(eq(supplierAudits.supplierId, id));
    await db.delete(supplierEvaluations).where(eq(supplierEvaluations.supplierId, id));
  }
  await db.delete(suppliers).where(and(eq(suppliers.userId, USER_ID), eq(suppliers.isoProjectId, PROJECT_ID)));
  await db.delete(supplierCriteria).where(and(eq(supplierCriteria.userId, USER_ID), eq(supplierCriteria.isoProjectId, PROJECT_ID)));
  console.log("  Cleared.\n");
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const SUPPLIER_SEEDS = [
  // ── Raw Materials ──────────────────────────────────────────────────────────
  {
    name: "Univar Solutions USA LLC",
    contactName: "Derek Haines",
    email: "dhaines@univarsolutions.com",
    phone: "(614) 882-4900",
    address: "Columbus, OH",
    category: "Chemical / Fluid",
    criticalityLevel: "critical",
    status: "active",
    isoCertType: "ISO 9001:2015",
    isoCertExpiry: "2026-03-15",
    isoCertUrl: "https://univarsolutions.com/certifications",
    reminderDaysBefore: 90,
    notes: "Primary distributor for ethylene glycol (EG) and diethylene glycol (DEG) — key base fluids for brake fluid and coolant production.",
  },
  {
    name: "BASF Corporation — Performance Chemicals",
    contactName: "Sandra Liu",
    email: "sandra.liu@basf.com",
    phone: "(973) 245-6000",
    address: "Florham Park, NJ",
    category: "Chemical / Fluid",
    criticalityLevel: "critical",
    status: "active",
    isoCertType: "IATF 16949:2016",
    isoCertExpiry: "2025-11-30",
    isoCertUrl: "https://basf.com/en/certifications.html",
    reminderDaysBefore: 90,
    notes: "Supplies corrosion inhibitor packages for EG-based coolants (OAT and HOAT formulations). Critical to final product performance.",
  },
  {
    name: "Afton Chemical Corporation",
    contactName: "Mark Teschler",
    email: "m.teschler@aftonchemical.com",
    phone: "(804) 788-5000",
    address: "Richmond, VA",
    category: "Chemical / Fluid",
    criticalityLevel: "critical",
    status: "active",
    isoCertType: "ISO 9001:2015",
    isoCertExpiry: "2026-08-22",
    isoCertUrl: "",
    reminderDaysBefore: 60,
    notes: "Supplies additive packages for DOT 3 / DOT 4 brake fluid formulations. Single-source for our proprietary additive blend.",
  },
  {
    name: "Ashland LLC — Specialty Ingredients",
    contactName: "Beth Carmody",
    email: "b.carmody@ashland.com",
    phone: "(859) 815-3333",
    address: "Covington, KY",
    category: "Chemical / Fluid",
    criticalityLevel: "major",
    status: "active",
    isoCertType: "ISO 9001:2015",
    isoCertExpiry: "2027-01-10",
    isoCertUrl: "https://ashland.com/quality-certifications",
    reminderDaysBefore: 60,
    notes: "Supplies poly glycol ethers (PGEs) and specialty glycols for DOT 5.1 brake fluid production.",
  },
  {
    name: "Troy Corporation — Microbiology Division",
    contactName: "Carlos Rivera",
    email: "carlos.rivera@troycorp.com",
    phone: "(973) 443-4200",
    address: "Florham Park, NJ",
    category: "Chemical / Fluid",
    criticalityLevel: "minor",
    status: "active",
    isoCertType: "ISO 9001:2015",
    isoCertExpiry: "2026-05-01",
    isoCertUrl: "",
    reminderDaysBefore: 45,
    notes: "Supplies biocides / preservatives for water-based coolant concentrates. Used at low volumes.",
  },
  // ── Packaging ──────────────────────────────────────────────────────────────
  {
    name: "Greif, Inc. — Industrial Packaging",
    contactName: "Lisa Fertig",
    email: "lfertig@greif.com",
    phone: "(740) 549-6000",
    address: "Delaware, OH",
    category: "Packaging",
    criticalityLevel: "major",
    status: "active",
    isoCertType: "ISO 9001:2015",
    isoCertExpiry: "2025-12-31",
    isoCertUrl: "https://greif.com/about/quality",
    reminderDaysBefore: 60,
    notes: "Supplies 55-gallon HDPE drums and 275-gal IBC totes for bulk brake fluid and coolant shipments.",
  },
  {
    name: "Berry Global Group — Rigid Open Top Division",
    contactName: "Tim Paulson",
    email: "tpaulson@berryglobal.com",
    phone: "(812) 306-2000",
    address: "Evansville, IN",
    category: "Packaging",
    criticalityLevel: "major",
    status: "active",
    isoCertType: "IATF 16949:2016",
    isoCertExpiry: "2026-09-15",
    isoCertUrl: "https://berryglobal.com/certifications",
    reminderDaysBefore: 60,
    notes: "Supplies HDPE bottles (1-qt, 1-gal, 1-L) for retail brake fluid and coolant packaging. IATF 16949 certified for automotive supply chain.",
  },
  {
    name: "Multi-Color Corporation — Dayton Plant",
    contactName: "Angela Brooks",
    email: "abrooks@multicolorcorp.com",
    phone: "(937) 298-2000",
    address: "Dayton, OH",
    category: "Service Provider",
    criticalityLevel: "minor",
    status: "active",
    isoCertType: "ISO 9001:2015",
    isoCertExpiry: "2026-06-30",
    isoCertUrl: "",
    reminderDaysBefore: 30,
    notes: "Local label and pressure-sensitive label supplier for all retail product SKUs.",
  },
  // ── Testing & Calibration ──────────────────────────────────────────────────
  {
    name: "Intertek Testing Services — Cincinnati Lab",
    contactName: "Dr. Priya Nambiar",
    email: "priya.nambiar@intertek.com",
    phone: "(513) 835-1600",
    address: "Cincinnati, OH",
    category: "Service Provider",
    criticalityLevel: "critical",
    status: "active",
    isoCertType: "ISO/IEC 17025:2017",
    isoCertExpiry: "2025-09-30",
    isoCertUrl: "https://intertek.com/automotive/lab-services",
    reminderDaysBefore: 90,
    notes: "Third-party FMVSS 116 DOT brake fluid testing (wet boiling point, dry boiling point, viscosity). Required for FMCSA regulatory compliance.",
  },
  {
    name: "Ohio Valley Calibration Services",
    contactName: "Jason Meeker",
    email: "jmeeker@ovcs-lab.com",
    phone: "(937) 224-9900",
    address: "Dayton, OH",
    category: "Service Provider",
    criticalityLevel: "minor",
    status: "active",
    isoCertType: "ISO/IEC 17025:2017",
    isoCertExpiry: "2026-03-31",
    isoCertUrl: "",
    reminderDaysBefore: 45,
    notes: "Annual calibration of lab instrumentation (viscometers, hydrometers, pressure gauges, balances). ISO 17025 accredited.",
  },
  // ── Logistics ─────────────────────────────────────────────────────────────
  {
    name: "Ruan Transportation Management Systems",
    contactName: "Connie Walsh",
    email: "cwalsh@ruan.com",
    phone: "(515) 245-2500",
    address: "Des Moines, IA",
    category: "Service Provider",
    criticalityLevel: "major",
    status: "active",
    isoCertType: "ISO 9001:2015",
    isoCertExpiry: "2026-11-01",
    isoCertUrl: "",
    reminderDaysBefore: 60,
    notes: "Dedicated carrier for bulk chemical tanker deliveries and finished goods distribution. HMIS / HAZMAT certified.",
  },
  {
    name: "Hixson Chemical Logistics LLC",
    contactName: "Gary Hixson",
    email: "ghixson@hixsonlogistics.com",
    phone: "(937) 557-3300",
    address: "Tipp City, OH",
    category: "Service Provider",
    criticalityLevel: "minor",
    status: "probationary",
    isoCertType: "",
    isoCertExpiry: "",
    isoCertUrl: "",
    reminderDaysBefore: 30,
    notes: "Regional small-batch delivery. Currently on probationary status due to two late deliveries in Q1 2025. Under 90-day performance review.",
  },
] as const;

// ─── Selection Criteria ──────────────────────────────────────────────────────

// Pre-qualification criteria — assessable without historical performance data
const CRITERIA_SEEDS = [
  {
    name: "ISO / IATF Certification Held",
    description: "Supplier holds a valid, accredited ISO 9001:2015 or IATF 16949:2016 certificate. Verified against IAF-accredited CB registry before initial approval. Score 10 = active cert in good standing; 1 = no certification held.",
    category: "quality",
    weight: 20,
    order: 0,
  },
  {
    name: "Completed Supplier Quality Questionnaire (SQQ)",
    description: "Supplier has returned a fully completed SQQ covering their QMS, process controls, equipment calibration, and non-conforming material handling procedures. Score 10 = all sections complete and satisfactory; 1 = no response.",
    category: "quality",
    weight: 20,
    order: 1,
  },
  {
    name: "First Article / Sample Qualification Results",
    description: "Submitted material samples or first article inspection (FAI) meet CCI Chemical's product specification (purity, viscosity, boiling point, etc.). Score 10 = all characteristics pass on first submission; 1 = critical failures.",
    category: "technical",
    weight: 20,
    order: 2,
  },
  {
    name: "Financial Stability & Business Continuity",
    description: "Supplier provides a D&B credit score, bank reference, or equivalent evidence of financial health, plus a documented business continuity or disaster recovery plan for supply chain risk mitigation.",
    category: "financial",
    weight: 15,
    order: 3,
  },
  {
    name: "Regulatory & Compliance Documentation",
    description: "Supplier provides current SDS sheets, REACH / RoHS declarations, and any applicable FMVSS 116 supporting data before first shipment to CCI Chemical. Score 10 = all required documents received; 1 = none provided.",
    category: "compliance",
    weight: 15,
    order: 4,
  },
  {
    name: "Technical Capability & Capacity Assessment",
    description: "Supplier demonstrates, via facility questionnaire or remote/on-site audit, that they have the laboratory equipment, process controls, and production capacity to meet CCI Chemical volume and purity requirements.",
    category: "technical",
    weight: 10,
    order: 5,
  },
] as const;

// ─── Evaluation scores (per criteria ID — resolved after insert) ─────────────

// Scores 1–10 for each supplier × criteria; keyed by supplier name
const EVAL_SCORES: Record<string, number[]> = {
  // [cert, quality, otd, compliance, financial, technical]
  "Univar Solutions USA LLC":                  [9, 9, 10, 9,  8, 8],
  "BASF Corporation — Performance Chemicals":  [10, 10, 9, 10, 10, 10],
  "Afton Chemical Corporation":                [9, 8, 9, 9, 9, 10],
  "Ashland LLC — Specialty Ingredients":       [9, 9, 10, 9, 8, 9],
  "Troy Corporation — Microbiology Division":  [8, 8, 9, 8, 7, 7],
  "Greif, Inc. — Industrial Packaging":        [8, 8, 8, 8, 9, 7],
  "Berry Global Group — Rigid Open Top Division": [10, 9, 9, 9, 10, 9],
  "Multi-Color Corporation — Dayton Plant":    [8, 8, 9, 7, 7, 6],
  "Intertek Testing Services — Cincinnati Lab":[10, 10, 9, 10, 9, 10],
  "Ohio Valley Calibration Services":          [10, 9, 10, 10, 7, 8],
  "Ruan Transportation Management Systems":    [8, 8, 8, 8, 8, 7],
  "Hixson Chemical Logistics LLC":             [3, 6, 4, 7, 5, 5],
};

// ─── Audit risk factors ──────────────────────────────────────────────────────

interface RiskFactors {
  criticalPart: boolean; recentNC: boolean; noCert: boolean;
  certExpiringSoon: boolean; singleSource: boolean;
  poorDelivery: boolean; noRecentEval: boolean; newSupplier: boolean;
}

const AUDIT_SEEDS: Record<string, { factors: RiskFactors; lastAuditDate: string; nextAuditDate: string; auditStatus: string; notes: string }> = {
  "Univar Solutions USA LLC": {
    factors: { criticalPart: true, recentNC: false, noCert: false, certExpiringSoon: false, singleSource: false, poorDelivery: false, noRecentEval: false, newSupplier: false },
    lastAuditDate: "2024-04-10", nextAuditDate: "2025-04-10", auditStatus: "overdue",
    notes: "Critical raw material supplier — annual audit required. Last audit passed with 2 minor observations. Schedule on-site visit.",
  },
  "BASF Corporation — Performance Chemicals": {
    factors: { criticalPart: true, recentNC: false, noCert: false, certExpiringSoon: true, singleSource: false, poorDelivery: false, noRecentEval: false, newSupplier: false },
    lastAuditDate: "2024-09-05", nextAuditDate: "2025-09-05", auditStatus: "scheduled",
    notes: "IATF 16949 cert expiring Nov 2025 — follow up on recertification status before next audit. Schedule remote desk audit.",
  },
  "Afton Chemical Corporation": {
    factors: { criticalPart: true, recentNC: false, noCert: false, certExpiringSoon: false, singleSource: true, poorDelivery: false, noRecentEval: false, newSupplier: false },
    lastAuditDate: "2024-06-20", nextAuditDate: "2025-06-20", auditStatus: "scheduled",
    notes: "Single-source for DOT brake fluid additive package. Elevated risk due to sole-source dependency. Annual on-site audit.",
  },
  "Greif, Inc. — Industrial Packaging": {
    factors: { criticalPart: false, recentNC: false, noCert: false, certExpiringSoon: true, singleSource: false, poorDelivery: false, noRecentEval: false, newSupplier: false },
    lastAuditDate: "2023-11-15", nextAuditDate: "2025-11-15", auditStatus: "scheduled",
    notes: "Cert expiring Dec 2025 — request updated cert before year-end. Low-risk packaging supplier.",
  },
  "Hixson Chemical Logistics LLC": {
    factors: { criticalPart: false, recentNC: true, noCert: true, certExpiringSoon: false, singleSource: false, poorDelivery: true, noRecentEval: false, newSupplier: false },
    lastAuditDate: "", nextAuditDate: "2025-06-01", auditStatus: "scheduled",
    notes: "Probationary supplier. Two on-time delivery failures Q1 2025. No ISO certification. Requires on-site audit before probationary period ends.",
  },
  "Intertek Testing Services — Cincinnati Lab": {
    factors: { criticalPart: true, recentNC: false, noCert: false, certExpiringSoon: true, singleSource: true, poorDelivery: false, noRecentEval: false, newSupplier: false },
    lastAuditDate: "2024-08-30", nextAuditDate: "2025-08-30", auditStatus: "scheduled",
    notes: "17025 lab cert expires Sep 2025 — confirm renewal. Single-source for FMVSS 116 compliance testing. Annual remote audit of LIMS records.",
  },
};

// ─── Score → riskLevel helper ─────────────────────────────────────────────

function calcRiskScore(f: RiskFactors): number {
  let s = 0;
  if (f.criticalPart)     s += 30;
  if (f.recentNC)         s += 25;
  if (f.noCert)           s += 20;
  if (f.certExpiringSoon) s += 15;
  if (f.singleSource)     s += 15;
  if (f.poorDelivery)     s += 20;
  if (f.noRecentEval)     s += 15;
  if (f.newSupplier)      s += 10;
  return Math.min(s, 100);
}

function riskLevel(score: number) {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function riskFrequency(score: number) {
  if (score >= 60) return "Annual";
  if (score >= 30) return "Every 2 Years";
  return "Every 3 Years";
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  CCI Chemical — Supplier Management Seed Script          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  await clearExisting();

  // 1. Insert selection criteria
  console.log("📋  Inserting selection criteria…");
  const criteriaRows = await db.insert(supplierCriteria).values(
    CRITERIA_SEEDS.map(c => ({ ...c, userId: USER_ID, isoProjectId: PROJECT_ID }))
  ).returning();
  console.log(`    ✓ ${criteriaRows.length} criteria inserted\n`);

  // 2. Insert suppliers
  console.log("🏭  Inserting suppliers…");
  const supplierRows = await db.insert(suppliers).values(
    SUPPLIER_SEEDS.map(s => ({ ...s, userId: USER_ID, isoProjectId: PROJECT_ID }))
  ).returning();
  console.log(`    ✓ ${supplierRows.length} suppliers inserted\n`);

  // 3. Insert evaluations
  console.log("📊  Inserting supplier evaluations…");
  let evalCount = 0;
  for (const sup of supplierRows) {
    const rawScores = EVAL_SCORES[sup.name];
    if (!rawScores) continue;

    // Build scores map: criteriaId → score
    const scoresMap: Record<string, number> = {};
    criteriaRows.forEach((c, i) => { scoresMap[String(c.id)] = rawScores[i] ?? 5; });

    // Weighted overall score
    const totalWeight = criteriaRows.reduce((s, c) => s + (c.weight || 0), 0);
    let weighted = 0;
    criteriaRows.forEach((c, i) => {
      weighted += ((rawScores[i] ?? 5) / 10) * ((c.weight || 0) / totalWeight) * 100;
    });
    const overallScore = Math.round(weighted);
    const recommendation =
      overallScore >= 80 ? "approved" : overallScore >= 60 ? "conditional" : "disqualified";

    await db.insert(supplierEvaluations).values({
      userId: USER_ID,
      isoProjectId: PROJECT_ID,
      supplierId: sup.id,
      evaluationDate: "2025-01-15",
      evaluatorName: "Raul Espinoza — Quality Manager",
      period: "Annual Review 2024",
      overallScore,
      recommendation,
      scores: scoresMap,
      notes: `Annual supplier evaluation completed Jan 2025. ${recommendation === "approved" ? "Supplier meets all CCI Chemical quality requirements." : recommendation === "conditional" ? "Supplier requires corrective action plan before next evaluation." : "Supplier requires immediate quality improvement plan and probationary review."}`,
    });
    evalCount++;
  }
  console.log(`    ✓ ${evalCount} evaluations inserted\n`);

  // 4. Insert audit assessments
  console.log("🔍  Inserting IATF audit risk assessments…");
  let auditCount = 0;
  for (const sup of supplierRows) {
    const seed = AUDIT_SEEDS[sup.name];
    if (!seed) continue;
    const score = calcRiskScore(seed.factors);
    await db.insert(supplierAudits).values({
      userId: USER_ID,
      isoProjectId: PROJECT_ID,
      supplierId: sup.id,
      riskScore: score,
      riskLevel: riskLevel(score),
      riskFactors: seed.factors,
      recommendedFrequency: riskFrequency(score),
      lastAuditDate: seed.lastAuditDate || null,
      nextAuditDate: seed.nextAuditDate || null,
      auditStatus: seed.auditStatus,
      notes: seed.notes,
    });
    auditCount++;
  }
  console.log(`    ✓ ${auditCount} audit assessments inserted\n`);

  // 5. Summary
  console.log("══════════════════════════════════════════════════════════");
  console.log("✅  Seed complete!\n");
  console.log("   Suppliers inserted:");
  for (const s of supplierRows) {
    const evalRow = await db.select().from(supplierEvaluations)
      .where(supplierEvaluations.supplierId === (s.id as any)).limit(1).catch(() => []);
    console.log(`     • ${s.name.padEnd(50)} [${s.criticalityLevel}] [${s.status}]`);
  }
  console.log("\n   Selection Criteria:");
  for (const c of criteriaRows) console.log(`     • ${c.name.padEnd(55)} ${c.weight}%`);
  console.log("");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
