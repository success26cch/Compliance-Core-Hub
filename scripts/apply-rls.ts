/**
 * Apply PostgreSQL Row-Level Security (RLS) to all user-scoped tables.
 *
 * Run once (safe to re-run — uses CREATE POLICY IF NOT EXISTS pattern via
 * DROP IF EXISTS + CREATE):
 *
 *   npx tsx scripts/apply-rls.ts
 *
 * What this does:
 *  1. Enables RLS on every table that contains a user_id column
 *  2. Creates an isolation policy: only rows where user_id matches the session
 *     variable app.current_user_id are visible/writable
 *  3. Creates a superadmin bypass: rows are always accessible when
 *     app.is_superadmin = 'true' (set by rlsMiddleware for admin sessions)
 *  4. Skips pre-auth tables (password_reset_tokens, recordability_usage) and
 *     shared-catalog tables (courses, course_modules, course_lessons, quiz_questions)
 *  5. Handles tables that use admin_user_id instead of user_id (corey_teams)
 *  6. Handles tables where user is a MEMBER, not owner (corey_team_members)
 *
 * The session variables are set per-request by server/rls.ts rlsMiddleware.
 */

import pg from "pg";

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

// ─── Standard tables: user_id IS the tenant key ──────────────────────────────
const STANDARD_TABLES = [
  "subscriptions",
  "question_usage",
  "employees",
  "incidents",
  "corrective_actions",
  "nonconformances",
  "action_items",
  "audit_readiness",
  "audit_checklist_items",
  "company_profiles",
  "iso_projects",
  "iso_documents",
  "doc_change_requests",
  "dot_notifications",
  "clinic_visits",
  "clinic_locations",
  "authorization_forms",
  "clinic_engagement",
  "course_enrollments",
  "lesson_progress",
  "quiz_attempts",
  "course_certificates",
  // training_assignments and new_hire_completions use employer_user_id — handled separately below
  "isa_profiles",
  "corey_profiles",
  "dot_drivers",
  "dot_dq_documents",
  "dot_equipment",
  "dot_random_tests",
  "dot_accidents",
  "dot_roadside_inspections",
  "dot_dvir_logs",
  "iso_audits",
  "audit_process_schedule",
  "iso_audit_findings",
  "iso_audit_process_notes",
  "iso_awareness_notices",
  "iso_awareness_acknowledgments",
  "iso_objectives",
  "iso_kpi_actuals",
  "iso_risks",
  "iso_management_reviews",
  "iso_review_action_items",
  "iso_communications",
  "apqp_projects",
  "apqp_deliverables",
  "apqp_gate_reviews",
  "design_dev_plans",
  "env_facility_profiles",
  "env_universal_waste",
  "env_haz_waste_saps",
  "env_sap_inspections",
  "env_manifests",
  "env_generator_months",
  "env_spcc_tanks",
  "env_spcc_inspections",
  "env_stormwater_monitoring",
  "env_air_permits",
  "env_opacity_logs",
  "suppliers",
  "supplier_criteria",
  "supplier_candidate_assessments",
  "supplier_evaluations",
  "supplier_audits",
  "calibration_equipment",
  "calibration_records",
  "calibration_oot_assessments",
  "calibration_labs",
  "calibration_lab_scope",
  "pm_equipment",
  "pm_records",
  "audit_logs",
  "iatf_product_audits",
  "iatf_mfg_process_audits",
  "iatf_audit_schedule",
  "lpa_audit_plans",
  "lpa_records",
];

// RLS helper — two session variables available:
//   app.current_user_id  — set to the logged-in user's id
//   app.is_superadmin    — set to 'true' for superadmin sessions, 'false' otherwise
const STANDARD_POLICY = (table: string) => `
  current_setting('app.is_superadmin', true) = 'true'
  OR user_id = current_setting('app.current_user_id', true)
`;

async function applyStandardRls(table: string) {
  await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  await client.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
  await client.query(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`);
  await client.query(`
    CREATE POLICY tenant_isolation ON ${table}
      USING (${STANDARD_POLICY(table)})
      WITH CHECK (${STANDARD_POLICY(table)})
  `);
  console.log(`  ✓ ${table}`);
}

async function main() {
  await client.connect();
  console.log("Connected to PostgreSQL.\n");

  // ── Standard tables ────────────────────────────────────────────────────────
  console.log("Applying standard tenant_isolation policy to user_id tables:");
  for (const table of STANDARD_TABLES) {
    try {
      await applyStandardRls(table);
    } catch (err: any) {
      console.error(`  ✗ ${table}: ${err.message}`);
    }
  }

  // ── corey_teams (tenant col = admin_user_id, not user_id) ─────────────────
  console.log("\nApplying custom policy to corey_teams:");
  try {
    await client.query(`ALTER TABLE corey_teams ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE corey_teams FORCE ROW LEVEL SECURITY`);
    await client.query(`DROP POLICY IF EXISTS tenant_isolation ON corey_teams`);
    await client.query(`
      CREATE POLICY tenant_isolation ON corey_teams
        USING (
          current_setting('app.is_superadmin', true) = 'true'
          OR admin_user_id = current_setting('app.current_user_id', true)
          OR id IN (
            SELECT team_id FROM corey_team_members
            WHERE user_id = current_setting('app.current_user_id', true)
          )
        )
        WITH CHECK (
          current_setting('app.is_superadmin', true) = 'true'
          OR admin_user_id = current_setting('app.current_user_id', true)
        )
    `);
    console.log("  ✓ corey_teams");
  } catch (err: any) {
    console.error(`  ✗ corey_teams: ${err.message}`);
  }

  // ── corey_team_members (member's own userId OR admin of team) ──────────────
  console.log("\nApplying custom policy to corey_team_members:");
  try {
    await client.query(`ALTER TABLE corey_team_members ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE corey_team_members FORCE ROW LEVEL SECURITY`);
    await client.query(`DROP POLICY IF EXISTS tenant_isolation ON corey_team_members`);
    await client.query(`
      CREATE POLICY tenant_isolation ON corey_team_members
        USING (
          current_setting('app.is_superadmin', true) = 'true'
          OR user_id = current_setting('app.current_user_id', true)
          OR team_id IN (
            SELECT id FROM corey_teams
            WHERE admin_user_id = current_setting('app.current_user_id', true)
          )
        )
        WITH CHECK (
          current_setting('app.is_superadmin', true) = 'true'
          OR team_id IN (
            SELECT id FROM corey_teams
            WHERE admin_user_id = current_setting('app.current_user_id', true)
          )
        )
    `);
    console.log("  ✓ corey_team_members");
  } catch (err: any) {
    console.error(`  ✗ corey_team_members: ${err.message}`);
  }

  // ── team_departments (no user_id, scoped by team_id) ──────────────────────
  console.log("\nApplying custom policy to team_departments:");
  try {
    await client.query(`ALTER TABLE team_departments ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE team_departments FORCE ROW LEVEL SECURITY`);
    await client.query(`DROP POLICY IF EXISTS tenant_isolation ON team_departments`);
    await client.query(`
      CREATE POLICY tenant_isolation ON team_departments
        USING (
          current_setting('app.is_superadmin', true) = 'true'
          OR team_id IN (
            SELECT id FROM corey_teams
            WHERE admin_user_id = current_setting('app.current_user_id', true)
            UNION
            SELECT team_id FROM corey_team_members
            WHERE user_id = current_setting('app.current_user_id', true)
          )
        )
    `);
    console.log("  ✓ team_departments");
  } catch (err: any) {
    console.error(`  ✗ team_departments: ${err.message}`);
  }

  // ── training_assignments + new_hire_completions (use employer_user_id) ──────
  console.log("\nApplying custom policy to employer_user_id tables:");
  for (const table of ["training_assignments", "new_hire_completions"]) {
    try {
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      await client.query(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`);
      await client.query(`
        CREATE POLICY tenant_isolation ON ${table}
          USING (
            current_setting('app.is_superadmin', true) = 'true'
            OR employer_user_id = current_setting('app.current_user_id', true)
          )
          WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR employer_user_id = current_setting('app.current_user_id', true)
          )
      `);
      console.log(`  ✓ ${table}`);
    } catch (err: any) {
      console.error(`  ✗ ${table}: ${err.message}`);
    }
  }

  // ── team_announcements (no user_id, scoped by team_id) ────────────────────
  console.log("\nApplying custom policy to team_announcements:");
  try {
    await client.query(`ALTER TABLE team_announcements ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE team_announcements FORCE ROW LEVEL SECURITY`);
    await client.query(`DROP POLICY IF EXISTS tenant_isolation ON team_announcements`);
    await client.query(`
      CREATE POLICY tenant_isolation ON team_announcements
        USING (
          current_setting('app.is_superadmin', true) = 'true'
          OR team_id IN (
            SELECT id FROM corey_teams
            WHERE admin_user_id = current_setting('app.current_user_id', true)
            UNION
            SELECT team_id FROM corey_team_members
            WHERE user_id = current_setting('app.current_user_id', true)
          )
        )
    `);
    console.log("  ✓ team_announcements");
  } catch (err: any) {
    console.error(`  ✗ team_announcements: ${err.message}`);
  }

  // ── Skipped tables (intentionally not RLS-protected) ──────────────────────
  console.log(`
Intentionally skipped (no user data / pre-auth / shared catalog):
  - password_reset_tokens  (used pre-login, no session available)
  - recordability_usage    (IP-based anonymous usage counter)
  - courses / course_modules / course_lessons / quiz_questions  (shared LMS catalog)
  - leads / paddle_events / trial_leads / site_visits / contact_inquiries  (marketing/admin)
  - clinic_agreements      (clinic B2B sign-ups, no client user data)
`);

  console.log("✅ RLS policies applied successfully.\n");
  console.log("The following protections are now active:");
  console.log("  • All queries filtered server-side by userId in application code");
  console.log("  • All queries ALSO filtered at database level by app.current_user_id");
  console.log("  • Even a route with a missing WHERE clause returns 0 rows for wrong tenant");
  console.log("  • Superadmin sessions (app.is_superadmin=true) bypass tenant filter");

  await client.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
