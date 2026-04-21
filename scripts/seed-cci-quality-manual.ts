/**
 * Seed script: Pre-populates the CCI Chemical quality manual (iso_documents id=34).
 *
 * Uses the canonical two-part QM prompt flow from server/qm-prompts.ts.
 * Runs sequential passes (Part A, Part B, plus depth-extension passes) accumulating
 * content until the ≥10,000-token (~40,000 char) target is met.
 *
 * Progress is tracked via <!--PASS_X--> markers embedded in saved content.
 * Markers are stripped ONLY when all planned passes are done AND target is met.
 * Re-running resumes from the next incomplete pass; if target not yet met after initial
 * four passes, additional extension passes are appended automatically.
 *
 * Per-call token budget is capped at MAX_TOKENS_PER_CALL to stay within the
 * modelfarm proxy timeout limit (~51s at 2500 tokens).
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { buildQmPartAPrompt, buildQmPartBPrompt, type QmPromptParams } from "../server/qm-prompts";

const ISO_DOC_ID = 34;
const PROJECT_ID = 4;

const MAX_TOKENS_PER_CALL = 2500;

// ≥10,000 tokens target expressed in chars (4 chars/token approximation)
const TARGET_CHARS = 40_000;

// ── Typed DB row shapes ──────────────────────────────────────────────────────
interface IsoProjectRow {
  org_name: string | null;
  org_address: string | null;
  total_employees: number | null;
  products_services: string | null;
  has_design_responsibility: boolean | null;
  standard: string | null;
  processes: Array<{ name: string; owner?: string; inputs?: string; outputs?: string }> | null;
}

interface IsoDocumentRow {
  content: string | null;
}

// ── DB helpers ───────────────────────────────────────────────────────────────
async function fetchProject(): Promise<IsoProjectRow> {
  const result = await db.execute(
    sql`SELECT org_name, org_address, total_employees, products_services,
               has_design_responsibility, standard, processes
        FROM iso_projects WHERE id = ${PROJECT_ID} LIMIT 1`
  );
  if (!result.rows.length) throw new Error(`iso_projects id=${PROJECT_ID} not found`);
  return result.rows[0] as unknown as IsoProjectRow;
}

async function getContent(): Promise<string> {
  const result = await db.execute(
    sql`SELECT COALESCE(content, '') AS content FROM iso_documents WHERE id = ${ISO_DOC_ID}`
  );
  return ((result.rows[0] as unknown as IsoDocumentRow)?.content) ?? "";
}

async function setContent(content: string): Promise<void> {
  const result = await db.execute(
    sql`UPDATE iso_documents SET content = ${content}, status = 'draft', updated_at = NOW()
        WHERE id = ${ISO_DOC_ID}`
  );
  const rowCount = (result as unknown as { rowCount?: number }).rowCount ?? 0;
  if (rowCount === 0) {
    throw new Error(`iso_documents id=${ISO_DOC_ID} not found — UPDATE affected 0 rows`);
  }
}

// ── Generation ───────────────────────────────────────────────────────────────
async function streamGenerate(systemPrompt: string, userMsg: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    timeout: 90_000,
  });
  let text = "";
  const stream = client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: MAX_TOKENS_PER_CALL,
    system: systemPrompt,
    messages: [{ role: "user", content: userMsg }],
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
    }
  }
  return text;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Returns actual content length without progress markers. */
function contentLengthWithoutMarkers(content: string): number {
  return content.replace(/\n?<!--PASS_[A-Z0-9]+-->/g, "").length;
}

/** Parses completed pass IDs from embedded markers. */
function parseCompletedIds(content: string): Set<string> {
  const ids = new Set<string>();
  const re = /<!--PASS_([A-Z0-9]+)-->/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) ids.add(m[1]);
  return ids;
}

// ── Pass definitions ─────────────────────────────────────────────────────────
interface Pass {
  id: string;
  label: string;
  system: string;
  user: string;
}

function buildInitialPasses(p: QmPromptParams): Pass[] {
  const a = buildQmPartAPrompt(p);
  const b = buildQmPartBPrompt(p);
  return [
    {
      id: "A",
      label: "Part A — Cover Page, Introduction, Sections 1-6",
      system: a,
      user: `Draft PART A of the Quality Management System Manual for ${p.orgName}. Cover the Cover Page, Introduction, and Sections 1 through 6 exactly as specified. End cleanly after Section 6.3.`,
    },
    {
      id: "B",
      label: "Part B — Sections 7-10 and Appendix A",
      system: b,
      user: `Draft PART B of the Quality Management System Manual for ${p.orgName}. Start with Section 7 SUPPORT — do not repeat sections 1-6. Cover Sections 7 through 10 and Appendix A completely.`,
    },
    {
      id: "A2",
      label: "Part A Extension — expanded depth on Sections 4-5",
      system: a,
      user: `Write expanded supplemental content for the ${p.orgName} quality manual on: (a) Section 4.1 — specific internal/external factors for ${p.orgName}'s market; (b) Section 4.4.1 — each process with KPIs and interaction points; (c) Section 5.2.1 — full Quality Policy statement. No "Per Clause" preambles, no Markdown. Label each subsection clearly.`,
    },
    {
      id: "B2",
      label: "Part B Extension — expanded depth on Sections 8-10",
      system: b,
      user: `Write expanded supplemental content for the ${p.orgName} quality manual on: (a) Section 8.5.1 — control plan and process control detail; (b) Section 9.1 — specific KPIs with targets and review frequencies; (c) Section 10.2 — 8D/5-Why corrective action steps. No "Per Clause" preambles, no Markdown. Label each subsection clearly.`,
    },
  ];
}

function buildExtensionPass(n: number, p: QmPromptParams): Pass {
  const a = buildQmPartAPrompt(p);
  const b = buildQmPartBPrompt(p);
  const isEven = n % 2 === 0;
  return {
    id: `E${n}`,
    label: `Extension pass E${n}`,
    system: isEven ? b : a,
    user: isEven
      ? `Write further supplemental content for the ${p.orgName} quality manual expanding on customer-specific requirements (CSR), supplier quality management (Section 8.4), and measurement system analysis (MSA) requirements under IATF 16949. Use ${p.orgName}'s organizational voice, no "Per Clause" preambles, no Markdown.`
      : `Write further supplemental content for the ${p.orgName} quality manual expanding on production part approval process (PPAP) requirements, layered process audits (LPA), and continual improvement initiatives (Section 10.3). Use ${p.orgName}'s organizational voice, no "Per Clause" preambles, no Markdown.`,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 Seeding CCI Chemical Quality Manual (iso_documents id=34)\n");

  let content = await getContent();
  let completedIds = parseCompletedIds(content);
  const noMarkers = completedIds.size === 0;

  // Already clean and long enough — nothing to do
  if (noMarkers && content.length >= TARGET_CHARS) {
    const tokens = Math.round(content.length / 4);
    console.log(`✅ Already seeded: ${content.length} chars (~${tokens} tokens). Exiting.\n`);
    process.exit(0);
  }

  console.log(`Completed passes so far: ${[...completedIds].join(", ") || "none"}`);
  console.log(`Content length: ${content.length} chars (target: ${TARGET_CHARS})\n`);

  const project = await fetchProject();
  const processes = Array.isArray(project.processes) ? project.processes : [];
  const processContext = processes.length
    ? processes.map(p => `  - ${p.name} | Owner: ${p.owner ?? ""} | Inputs: ${p.inputs ?? ""} | Outputs: ${p.outputs ?? ""}`).join("\n")
    : "No processes defined.";

  const standard = project.standard ?? "IATF 16949";
  const params: QmPromptParams = {
    orgName: project.org_name ?? "CCI Chemical",
    orgAddr: project.org_address ?? "",
    productsServices: project.products_services ?? "Not specified",
    employees: project.total_employees ?? "?",
    standard,
    isIATF: standard.toUpperCase().includes("IATF"),
    hasDesign: project.has_design_responsibility ?? false,
    processContext,
    todayStr: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
  };

  // Run the four initial passes, resuming from where we left off
  const initialPasses = buildInitialPasses(params);
  for (const pass of initialPasses) {
    if (completedIds.has(pass.id)) {
      console.log(`[SKIP] ${pass.label}`);
      continue;
    }

    console.log(`[GEN ] ${pass.label}...`);
    const t0 = Date.now();
    const result = await streamGenerate(pass.system, pass.user);
    if (!result || result.length < 500) {
      throw new Error(`Pass ${pass.id} returned insufficient content (${result.length} chars)`);
    }
    content = content + "\n\n" + result + `\n<!--PASS_${pass.id}-->`;
    await setContent(content);
    completedIds = parseCompletedIds(content);
    console.log(`  ✓ ${result.length} chars in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    await sleep(2000);
  }

  // Keep adding extension passes (E1, E2, …) until target is reached.
  // Previously completed E-passes are skipped on rerun via completedIds check.
  let extN = 1;
  // Safety ceiling prevents infinite loops while still allowing many more passes than needed.
  const MAX_EXTENSIONS = 20;
  while (contentLengthWithoutMarkers(content) < TARGET_CHARS && extN <= MAX_EXTENSIONS) {
    const pass = buildExtensionPass(extN, params);
    if (completedIds.has(pass.id)) {
      console.log(`[SKIP] ${pass.label}`);
      extN++;
      continue;
    }
    console.log(`[GEN ] ${pass.label} (content still below target)...`);
    const t0 = Date.now();
    const result = await streamGenerate(pass.system, pass.user);
    if (!result || result.length < 500) {
      throw new Error(`Pass ${pass.id} returned insufficient content (${result.length} chars)`);
    }
    content = content + "\n\n" + result + `\n<!--PASS_${pass.id}-->`;
    await setContent(content);
    completedIds = parseCompletedIds(content);
    console.log(`  ✓ ${result.length} chars in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    await sleep(2000);
    extN++;
  }

  const rawLength = contentLengthWithoutMarkers(content);

  if (rawLength < TARGET_CHARS) {
    // Save progress but do not finalize — a subsequent run will resume extension passes
    // from E${extN} onward until target is reached.
    console.warn(`\n⚠  Content is ${rawLength} chars (target: ${TARGET_CHARS} chars) after reaching extension E${extN - 1}.`);
    console.warn(`   Re-run this script — it will resume from E${extN} and keep adding passes until target is met.\n`);
    process.exit(0);
  }

  // Target met — strip markers and finalize
  const finalContent = content.replace(/\n?<!--PASS_[A-Z0-9]+-->/g, "").trim();
  await setContent(finalContent);

  const tokens = Math.round(finalContent.length / 4);
  console.log(`\n✅ Complete: ${finalContent.length} chars (~${tokens} tokens) written to iso_documents id=${ISO_DOC_ID}`);
  console.log(`   Target of ≥${TARGET_CHARS} chars met.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
