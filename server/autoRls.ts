/**
 * Auto-RLS Enforcement — runs on every server startup.
 *
 * Scans the live database for any table that:
 *   - lives in the public schema
 *   - has a user_id OR employer_user_id column
 *   - does NOT already have the tenant_isolation policy
 *
 * For each such table it applies the correct Row-Level Security policy
 * automatically, so new tables built during development are protected
 * without any manual steps.
 *
 * Tables that need custom policies (team membership cross-joins) are
 * managed by scripts/apply-rls.ts and are excluded here.
 *
 * Intentionally excluded (no user data / pre-auth / shared catalog):
 *   password_reset_tokens, recordability_usage, clinic_agreements,
 *   courses, course_modules, course_lessons, quiz_questions,
 *   leads, paddle_events, trial_leads, site_visits, contact_inquiries
 */

import pg from "pg";

const { Pool } = pg;

// ── Tables that already have custom (non-standard) RLS policies ───────────────
// Managed manually via scripts/apply-rls.ts. Do NOT auto-overwrite them.
const CUSTOM_POLICY_TABLES = new Set([
  "corey_teams",          // uses admin_user_id + member subquery
  "corey_team_members",   // member's own user_id OR admin of team
  "team_departments",     // team_id subquery (no user_id column)
  "team_announcements",   // team_id subquery (no user_id column)
]);

// ── Tables intentionally skipped (no client data / shared catalog) ────────────
const EXCLUDED_TABLES = new Set([
  "users",                    // the users table itself
  "password_reset_tokens",    // pre-login, no session available
  "recordability_usage",      // anonymous IP-based counter
  "clinic_agreements",        // B2B clinic sign-up, not a client row
  "courses",                  // shared LMS catalog
  "course_modules",           // shared LMS catalog
  "course_lessons",           // shared LMS catalog
  "quiz_questions",           // shared LMS catalog
  "leads",                    // marketing
  "paddle_events",            // payment events
  "trial_leads",              // marketing
  "site_visits",              // marketing
  "contact_inquiries",        // marketing
]);

const SUPERADMIN_CHECK = `current_setting('app.is_superadmin', true) = 'true'`;

async function applyPolicy(
  client: InstanceType<typeof Pool>["Client"] extends never ? any : any,
  table: string,
  tenantCol: string,
) {
  const condition = `${SUPERADMIN_CHECK} OR ${tenantCol} = current_setting('app.current_user_id', true)`;
  await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  await client.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
  await client.query(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`);
  await client.query(`
    CREATE POLICY tenant_isolation ON ${table}
      USING  (${condition})
      WITH CHECK (${condition})
  `);
}

export async function enforceRlsOnStartup(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // 1. Find tables with user_id or employer_user_id columns
    const colRes = await client.query<{
      table_name: string;
      column_name: string;
    }>(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN ('user_id', 'employer_user_id')
      ORDER BY table_name, column_name
    `);

    // Prefer user_id when a table has both; employer_user_id as fallback
    const tableToCol = new Map<string, string>();
    for (const { table_name, column_name } of colRes.rows) {
      if (!tableToCol.has(table_name) || column_name === "user_id") {
        tableToCol.set(table_name, column_name);
      }
    }

    // 2. Find tables that ALREADY have tenant_isolation policy
    const policyRes = await client.query<{ tablename: string }>(`
      SELECT tablename FROM pg_policies
      WHERE schemaname = 'public' AND policyname = 'tenant_isolation'
    `);
    const alreadyProtected = new Set(policyRes.rows.map((r) => r.tablename));

    // 3. Determine which tables need auto-protection
    const toProtect: Array<{ table: string; col: string }> = [];
    for (const [table, col] of tableToCol) {
      if (CUSTOM_POLICY_TABLES.has(table)) continue; // handled by apply-rls.ts
      if (EXCLUDED_TABLES.has(table)) continue;       // intentionally skipped
      if (alreadyProtected.has(table)) continue;      // already done
      toProtect.push({ table, col });
    }

    if (toProtect.length === 0) {
      const total = alreadyProtected.size;
      console.log(`[RLS] ✓ All ${total} tenant tables already protected.`);
      return;
    }

    // 4. Apply missing policies
    console.log(`[RLS] Auto-applying tenant_isolation to ${toProtect.length} new table(s):`);
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const { table, col } of toProtect) {
      try {
        await applyPolicy(client, table, col);
        console.log(`[RLS]   ✓ ${table} (${col})`);
        succeeded.push(table);
      } catch (err: any) {
        console.error(`[RLS]   ✗ ${table}: ${err.message}`);
        failed.push(table);
      }
    }

    const totalNow = alreadyProtected.size + succeeded.length;
    console.log(
      `[RLS] ${succeeded.length} new table(s) protected. Total: ${totalNow} tables.` +
      (failed.length ? ` (${failed.length} failed — check logs above)` : ""),
    );
  } finally {
    client.release();
    await pool.end();
  }
}
