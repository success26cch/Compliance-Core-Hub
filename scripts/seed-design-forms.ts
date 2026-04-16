/**
 * seed-design-forms.ts
 * Drafts the 6 controlled forms + 2 procedures referenced in the
 * "Product Design and Development Procedure" (iso_documents id=50)
 * Target: CCI Chemical, Inc. | userId=54320068 | isoProjectId=4 | IATF 16949:2016
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "../server/db";
import { isoDocuments } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const client = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const ORG = "CCI Chemical, Inc. (Dayton OH) — DOT 3/4/5.1 brake fluids, OAT/HOAT engine coolants. IATF 16949:2016. OEM customers: GM, Ford, Stellantis. userId=54320068, isoProjectId=4.";

interface DocDef {
  title: string;
  docType: "template" | "procedure";
  isoClause: string;
  tags: string[];
  prompt: string;
}

const DOCS: DocDef[] = [
  {
    title: "FRM-DDP-002 Design Input Requirements Matrix",
    docType: "template",
    isoClause: "8.3.3",
    tags: ["IATF 16949", "Design & Development", "FRM-DDP-002"],
    prompt: `Draft the FRM-DDP-002 Design Input Requirements Matrix form template for ${ORG}
IATF 16949:2016 Clause 8.3.3. Format as a professional fillable ISO form.

Include:
1. Header fields: Product Name, Project #, Customer(s), Spec Reference, Prepared By, Approved By, Revision, Date.
2. Requirements matrix table (columns: Req# | Category | Requirement Description | Source/Reference | Acceptance Criteria | Priority | Special Characteristic? | Verification Method | Status). Include 20 realistic rows for brake fluid covering: dry/wet boiling point (DOT 4 per FMVSS 116), viscosity @-40°C and 100°C, pH, corrosion per SAE J1703 (tin, steel, aluminum, brass, copper, cast iron), elastomer swell (SBR/EPDM), fluid stability at 185°F, water tolerance ASTM D1744, specific gravity, flash point, OEM spec compliance (GM6278M or Ford WSS-M97B44-D), packaging HDPE compatibility, SDS/GHS compliance, IMDS submission, shelf life ≥4 yrs.
3. Conflict Resolution Log table.
4. Sign-off section (R&D Manager, Quality Manager).
Use dashes/underlines for blank fields. Output only the document content.`,
  },
  {
    title: "FRM-DDP-003 Design Review Meeting Minutes",
    docType: "template",
    isoClause: "8.3.4",
    tags: ["IATF 16949", "Design & Development", "FRM-DDP-003"],
    prompt: `Draft the FRM-DDP-003 Design Review Meeting Minutes form template for ${ORG}
IATF 16949:2016 Clauses 8.3.4 / 8.3.4.1 / 8.3.4.2. Format as a professional fillable ISO form.

Include:
1. Meeting header: Project Name, Project#, Review Type (Stage Gate/Interim/Final), Gate# (1–5), Date, Location, Facilitator.
2. Attendees table: Name | Dept/Role | Company | Present(Y/N) | Signature.
3. Design Status Review table: for each area below, columns Status (Complete/In Progress/Not Started/N/A) + Comments — design inputs vs matrix (FRM-DDP-002), formulation status, lab test results, DVP&R progress (FRM-DDP-004), risk assessment update, special characteristics, regulatory compliance, IMDS/CAMDS status, supplier raw material status, scale-up readiness.
4. Open Action Items table: Item# | Description | Owner | Due Date | Priority | Status.
5. Gate Decision: Approved / Approved with Conditions / Not Approved checkboxes; signature lines for R&D Manager, Quality Manager, Customer Rep (if applicable).
6. Next Review scheduling block.
Output only the document content.`,
  },
  {
    title: "FRM-DDP-004 Design Verification Report (DVP&R)",
    docType: "template",
    isoClause: "8.3.5",
    tags: ["IATF 16949", "Design & Development", "FRM-DDP-004", "DVP&R"],
    prompt: `Draft the FRM-DDP-004 Design Verification Plan and Report (DVP&R) form template for ${ORG}
IATF 16949:2016 Clause 8.3.5. Format as a professional fillable ISO form.

Include:
1. Header: Product Name, Product#, Customer(s), Project#, DVP&R Version, Prepared By, Reviewed By, Approved By, Date.
2. Main test matrix table (columns: Item# | Input Req# | Requirement Description | Special Char? | Test Method/Standard | Test Lab | Sample Size | Acceptance Criteria | Planned Date | Actual Date | Sample ID | Result | Pass/Fail | Report Ref | Comments). Include 20 realistic pre-filled rows for brake fluid/coolant testing: dry boiling pt (FMVSS 116, ≥230°C), wet boiling pt (≥155°C), viscosity @-40°C (ASTM D1665, ≤1800mm²/s), viscosity @100°C (ASTM D445, ≥1.5mm²/s), pH (ASTM D1121, 7.0–11.5), corrosion tests per SAE J1703 (tin/steel/Al/brass/Cu/cast iron — max mg/cm² per spec), elastomer swell SBR and EPDM per SAE J1703, fluid stability 185°F/24h, water tolerance ASTM D1744, specific gravity ASTM D1298, flash point ASTM D93, OEM spec compliance (GM6278M), packaging HDPE compatibility.
3. Verification Failures / Corrective Actions log table.
4. Summary sign-off: totals (planned/completed/passed/failed/open), overall status checkboxes, signatures.
Output only the document content.`,
  },
  {
    title: "FRM-DDP-005 Design Validation Report",
    docType: "template",
    isoClause: "8.3.6",
    tags: ["IATF 16949", "Design & Development", "FRM-DDP-005"],
    prompt: `Draft the FRM-DDP-005 Design Validation Report form template for ${ORG}
IATF 16949:2016 Clause 8.3.6. Format as a professional fillable ISO form.

Include:
1. Header: Product Name, Project#, Customer(s), Customer Spec#, Validation Method, Report Version, Prepared/Approved By, Date.
2. Validation Scope section: summary of what is being validated, reference to FRM-DDP-001/004, applicable CSR requirements (GM/Ford/Stellantis), DOT FMVSS 116 pathway, production representative sample lot info.
3. OEM/Customer Validation Results table: Test/Activity | Conducted By | Location | Date | Spec Ref | Acceptance Criteria | Actual Result | Pass/Fail | Certificate Ref. Pre-fill rows: OEM lab evaluation, high-temp stability/aging, vehicle fleet compatibility, extended corrosion study (3/6/12-month), DOT FMVSS 116 independent lab cert, environmental stress (freeze-thaw).
4. Regulatory Approval Status block: DOT self-cert, SDS filing, IMDS/CAMDS submission details.
5. Validation Issues/Disposition log table.
6. PPAP Readiness checklist: Level required, PSW, DVP&R, Control Plan, PFMEA, IMDS, sample parts checkboxes.
7. Final sign-off: Validated/Conditional/Failed checkboxes, Quality Manager and R&D Manager signatures.
Output only the document content.`,
  },
  {
    title: "FRM-DDP-006 Design Change Request",
    docType: "template",
    isoClause: "8.3.7",
    tags: ["IATF 16949", "Design & Development", "FRM-DDP-006", "Management of Change"],
    prompt: `Draft the FRM-DDP-006 Design Change Request (DCR) form template for ${ORG}
IATF 16949:2016 Clauses 8.3.6 / 8.3.7 / 8.1.2 (Management of Change). Format as a professional fillable ISO form.

Include:
1. Header: DCR#, Product Name/Number, Customer(s), Current Approved Spec Reference, Change Request Date, Requested By, Department, Priority (Urgent/Normal/Planned).
2. Description of Proposed Change: current state, proposed state, reason/justification, attachments.
3. Impact Assessment table: rows for — Customer OEM Spec Compliance, DOT/FMVSS 116 Regulatory, PFMEA/Special Characteristics, Control Plan Revision, SDS/GHS/Regulatory Docs, IMDS/CAMDS Re-submission, Packaging/Labeling, Customer Notification (per CSR), PPAP Re-submission (Level___), Supplier/Raw Material Change, Internal Lab Testing, External/OEM Testing. Columns: Impact Area | Affected(Y/N) | Description | Action Required.
4. Risk Assessment Summary: level (Low/Medium/High), key risks, reference document.
5. Testing/Verification Plan: tests required, DVP&R revision reference, completion date.
6. Customer Notification section: required Y/N, method (per CSR), approval required Y/N, approval received Y/N/Pending.
7. Approval and Implementation block: approvers (R&D Manager, Quality Manager, Plant Manager), implementation date, documents updated, post-implementation verification.
8. Revision History table.
Output only the document content.`,
  },
  {
    title: "QP-R-001 Risk and Opportunity Management",
    docType: "procedure",
    isoClause: "6.1",
    tags: ["IATF 16949", "Risk Management", "QP-R-001"],
    prompt: `Draft a Quality Procedure "QP-R-001 Risk and Opportunity Management" for ${ORG}
IATF 16949:2016 Clause 6.1 / 9.1.3. Format as a professional ISO procedure.

Structure:
1. PURPOSE — 2–3 sentences.
2. SCOPE — what is covered/excluded.
3. REFERENCES — IATF 16949 Clauses 6.1/9.1.3, QP-001, related QPs, FRM-DDP-006.
4. DEFINITIONS — Risk, Opportunity, RPN, Residual Risk, SWOT, PESTLE, Likelihood/Severity/Detectability (L/S/D).
5. RESPONSIBILITIES — table: Quality Manager, R&D Manager, Process Owners, Sales/Account Mgr, Regulatory Affairs, Top Management.
6. PROCEDURE:
   6.1 Risk & Opportunity Identification — inputs: PESTLE/SWOT, interested parties, audit findings, customer complaints, management review, CSR updates, NPI.
   6.2 Risk Assessment — L×S×D scoring (1–5 each), RPN thresholds (Low 1–20 monitor; Medium 21–60 action plan; High >60 escalate). Include 5 example risk scenarios specific to brake fluid/coolant chemical manufacturing (e.g., raw material single-source risk, formulation stability post-change, OEM spec update trigger, DOT re-certification risk, environmental release risk).
   6.3 Risk Response — Accept, Transfer, Mitigate, Avoid. Link to CAPA.
   6.4 Opportunity Capture — new product lines, supply chain improvement.
   6.5 Monitoring & Review — quarterly Register review in Management Review, annual PESTLE/SWOT.
7. RECORDS — Risk Register, PESTLE/SWOT, Management Review minutes.
8. REVISION HISTORY table — Rev 1.0 | 2026-04-15 | Initial release | E. Villarreal.
Output only the document content.`,
  },
  {
    title: "QP-010 Management of Change",
    docType: "procedure",
    isoClause: "8.1.2",
    tags: ["IATF 16949", "Management of Change", "QP-010"],
    prompt: `Draft a Quality Procedure "QP-010 Management of Change" for ${ORG}
IATF 16949:2016 Clauses 8.1.2, 8.3.7, 6.3. Format as a professional ISO procedure.

Structure:
1. PURPOSE — controls changes to prevent quality/safety/regulatory consequences; ensures customer notification per CSR; triggers PPAP re-submission when required.
2. SCOPE — covers: formulation changes, raw material/supplier substitutions, process parameter changes, equipment, packaging, facility layout. Excludes routine maintenance and minor batch variation within spec.
3. REFERENCES — IATF 16949 Clauses 8.1.2/8.3.7, GM/Ford/Stellantis CSR change notification requirements, FRM-DDP-006, QP-007 Risk Mgmt, QP-005 CAPA.
4. DEFINITIONS — Temporary Change, Permanent Change, PPAP-Triggering Change, Customer Notification Event, Emergency Change.
5. RESPONSIBILITIES — table: Quality Manager, R&D Manager, Process/Plant Manager, Regulatory Affairs, Sales/Account Mgr, Document Control.
6. PROCEDURE:
   6.1 Change Initiation — who, how (FRM-DDP-006), required information.
   6.2 Change Classification — 3 tiers: Tier 1 Minor (internal approval only), Tier 2 Significant (customer notification, possible approval), Tier 3 PPAP-Triggering (full re-submission). List 4–5 examples per tier specific to brake fluid/coolant manufacturing.
   6.3 Impact Assessment — reference FRM-DDP-006 Section 3; areas: regulatory, OEM spec, PFMEA, Control Plan, SDS/IMDS, labeling, packaging, QMS docs.
   6.4 Approval Process — internal matrix by tier; external customer approval via CSR process.
   6.5 Implementation — pre-implementation testing, first production lot traceability, document updates required (CP, PFMEA, WI, SDS, BOM).
   6.6 Change Validation — verification that change was implemented correctly; monitoring period.
   6.7 Emergency Changes — urgent change process, retroactive documentation.
   6.8 Temporary Changes — deviation process, extension, conversion to permanent.
7. RECORDS — Change Request Log (FRM-DDP-006), Customer Approval Records, PPAP packages, Implementation Verification Records.
8. REVISION HISTORY table — Rev 1.0 | 2026-04-15 | Initial release | E. Villarreal.
Output only the document content.`,
  },
];

async function generateContent(doc: DocDef): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3500,
    system:
      "You are an IATF 16949 Lead Auditor and QMS specialist for automotive chemical manufacturing. " +
      "Draft professional, audit-ready documents with clear structure, tables, and CCI Chemical-specific content. " +
      "Use ## for section headers, | for tables, **bold** for field labels. Use underscores for fillable fields. " +
      "Output ONLY the document — no preamble, no closing remarks.",
    messages: [{ role: "user", content: doc.prompt }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block in response");
  return block.text;
}

async function main() {
  console.log(`\nSeeding ${DOCS.length} documents for CCI Chemical...\n`);

  for (const doc of DOCS) {
    // Check if already exists
    const existing = await db
      .select({ id: isoDocuments.id })
      .from(isoDocuments)
      .where(and(eq(isoDocuments.userId, "54320068"), eq(isoDocuments.title, doc.title)));

    if (existing.length > 0) {
      console.log(`[SKIP] ${doc.title}`);
      continue;
    }

    console.log(`[GEN]  ${doc.title}...`);
    try {
      const content = await generateContent(doc);
      await db.insert(isoDocuments).values({
        userId: "54320068",
        isoProjectId: 4,
        docType: doc.docType,
        title: doc.title,
        content,
        isoClause: doc.isoClause,
        status: "draft",
        version: "1.0",
        tags: doc.tags,
      });
      console.log(`[OK]   ${doc.title} (${content.length} chars)`);
    } catch (err) {
      console.error(`[ERR]  ${doc.title}:`, (err as Error).message);
    }
  }

  console.log("\nDone.");
  process.exit(0);
}

main();
