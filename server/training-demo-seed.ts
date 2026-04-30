/**
 * Idempotent training demo seed for CCI Chemical (user 54320068 / Ebeni).
 * Runs on every server startup. Each data type is guarded independently so
 * partial states (e.g. employees exist but competency records were wiped) are
 * automatically backfilled without duplicating existing rows.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const EBENI_USER_ID = "54320068";

export async function seedTrainingDemoIfEmpty(): Promise<void> {
  try {
    // ── Step 1: Ensure employees exist; capture IDs ──────────────────────────
    const empResult = await db.execute(sql`
      SELECT id, first_name FROM employees WHERE user_id = ${EBENI_USER_ID} ORDER BY id
    `);
    const existingEmps = empResult.rows as { id: string | number; first_name: string }[];

    let empMap: Record<string, number> = {};

    if (existingEmps.length >= 12) {
      for (const row of existingEmps) empMap[row.first_name] = Number(row.id);
      console.log(`[training-seed] Employees already seeded (${existingEmps.length} rows).`);
    } else if (existingEmps.length === 0) {
      console.log("[training-seed] Seeding CCI Chemical employees…");
      const ins = await db.execute(sql`
        INSERT INTO employees (user_id, first_name, last_name, position, department, hire_date, status)
        VALUES
          (${EBENI_USER_ID}, 'Marcus',   'Webb',     'EHS Manager / DER',             'EHS & Safety',       '2019-03-15', 'active'),
          (${EBENI_USER_ID}, 'Diana',    'Torres',   'Lead Process Chemist',           'R&D / Formulation',  '2017-07-01', 'active'),
          (${EBENI_USER_ID}, 'James',    'Kowalski', 'Chemical Process Operator I',    'Production',         '2021-01-10', 'active'),
          (${EBENI_USER_ID}, 'Aisha',    'Franklin', 'Chemical Process Operator II',   'Production',         '2020-06-22', 'active'),
          (${EBENI_USER_ID}, 'Roberto',  'Sanchez',  'Chemical Process Operator II',   'Production',         '2020-09-05', 'active'),
          (${EBENI_USER_ID}, 'Brittany', 'Hale',     'QC Lab Technician',              'Quality',            '2022-02-14', 'active'),
          (${EBENI_USER_ID}, 'Devon',    'Marsh',    'Maintenance Mechanic',           'Maintenance',        '2018-11-30', 'active'),
          (${EBENI_USER_ID}, 'Priya',    'Nair',     'Shipping & Receiving Lead',      'Logistics',          '2023-04-03', 'active'),
          (${EBENI_USER_ID}, 'Carlos',   'Reyes',    'Forklift Operator / Logistics',  'Logistics',          '2023-08-21', 'active'),
          (${EBENI_USER_ID}, 'Angela',   'Kim',      'HR & Safety Coordinator',        'Human Resources',    '2021-05-17', 'active'),
          (${EBENI_USER_ID}, 'Trevor',   'Bishop',   'Electrical Maintenance Tech',    'Maintenance',        '2019-09-09', 'active'),
          (${EBENI_USER_ID}, 'Latoya',   'Greene',   'Blending Operator',              'Production',         '2022-11-01', 'active')
        RETURNING id, first_name
      `);
      for (const row of ins.rows as any[]) empMap[row.first_name] = Number(row.id);
      console.log(`[training-seed] Inserted ${ins.rows.length} employees.`);
    } else {
      for (const row of existingEmps) empMap[row.first_name] = Number(row.id);
      console.log(`[training-seed] Partial employee set found (${existingEmps.length} rows) — using existing IDs.`);
    }

    const marcus   = empMap['Marcus'];
    const diana    = empMap['Diana'];
    const james    = empMap['James'];
    const aisha    = empMap['Aisha'];
    const roberto  = empMap['Roberto'];
    const brittany = empMap['Brittany'];
    const devon    = empMap['Devon'];
    const priya    = empMap['Priya'];
    const carlos   = empMap['Carlos'];
    const angela   = empMap['Angela'];
    const trevor   = empMap['Trevor'];
    const latoya   = empMap['Latoya'];

    // ── Step 2: Competency Requirements ──────────────────────────────────────
    const reqRes = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM competency_requirements WHERE user_id = ${EBENI_USER_ID}
    `);
    const reqCount = Number((reqRes.rows[0] as any).cnt);
    if (reqCount === 0) {
      await db.execute(sql`
        INSERT INTO competency_requirements (user_id, job_title, competency_name, competency_type, description, standard, clause, is_required)
        VALUES
          (${EBENI_USER_ID}, 'EHS Manager / DER',         'OSHA 30-Hour General Industry',           'training',   'Must hold current OSHA 30-Hour card',                          'OSHA',             '1910',      true),
          (${EBENI_USER_ID}, 'EHS Manager / DER',         'Incident Investigation Methodology',      'skill',      'Ability to conduct root-cause investigations',                 'ISO 45001:2018',   '10.2',      true),
          (${EBENI_USER_ID}, 'EHS Manager / DER',         'OSHA Recordkeeping (29 CFR 1904)',         'training',   'OSHA 300 log and recordability determination',                'OSHA',             '1904',      true),
          (${EBENI_USER_ID}, 'EHS Manager / DER',         'DOT/DER Qualification',                   'certificate','Designated Employer Representative (DER) certification',       'DOT 49 CFR 40',   '40.341',    true),
          (${EBENI_USER_ID}, 'QC Lab Technician',         'GD&T Fundamentals',                       'training',   'Understanding of GD&T principles',                            'ASME Y14.5',      '7.2',       true),
          (${EBENI_USER_ID}, 'QC Lab Technician',         'Statistical Process Control (SPC)',        'training',   'Ability to set up and interpret SPC charts',                  'IATF 16949:2016', '7.2',       true),
          (${EBENI_USER_ID}, 'QC Lab Technician',         'Measurement System Analysis (MSA)',        'training',   'Gauge R&R study knowledge',                                   'IATF 16949:2016', '7.2',       true),
          (${EBENI_USER_ID}, 'QC Lab Technician',         'PPAP Documentation',                      'training',   'Ability to prepare and review PPAP packages',                 'IATF 16949:2016', '8.3.4',     false),
          (${EBENI_USER_ID}, 'Chemical Process Operator I','Workplace Safety Orientation',            'training',   'Company safety orientation completion',                       'ISO 45001:2018',  '7.2',       true),
          (${EBENI_USER_ID}, 'Chemical Process Operator I','Hazard Communication / GHS',              'training',   'SDS reading & chemical labeling (OSHA 1910.1200)',            'OSHA',            '1910.1200', true),
          (${EBENI_USER_ID}, 'Chemical Process Operator I','Chemical Blending WI-003 (Batch Mixing)', 'skill',     'Demonstrated competency on blending work instruction',        'IATF 16949:2016', '7.2.2',     true),
          (${EBENI_USER_ID}, 'Maintenance Mechanic',      'Lockout/Tagout (LOTO) – OSHA 1910.147',  'certificate','Current LOTO certification',                                   'OSHA',            '1910.147',  true),
          (${EBENI_USER_ID}, 'Maintenance Mechanic',      'Preventive Maintenance Procedures (PM-001)','skill',    'OJT on PM-001 procedure',                                     'IATF 16949:2016', '7.1.3',     true)
      `);
      console.log("[training-seed] Inserted competency requirements.");
    } else {
      console.log(`[training-seed] Competency requirements already present (${reqCount} rows) — skipping.`);
    }

    // ── Step 3: Employee Competency Records ───────────────────────────────────
    const crRes = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM employee_competency_records WHERE user_id = ${EBENI_USER_ID}
    `);
    const crCount = Number((crRes.rows[0] as any).cnt);
    if (crCount === 0 && marcus && diana && james && aisha && roberto && brittany && devon && trevor) {
      await db.execute(sql`
        INSERT INTO employee_competency_records (user_id, employee_id, competency_name, evidence_type, provider, completed_date, expiry_date, status, is_ojt, effectiveness_verified, notes)
        VALUES
          (${EBENI_USER_ID}, ${marcus},   'OSHA 30-Hour General Industry',           'certificate', 'OSHA Training Institute', '2022-06-15', '2025-06-15', 'active', false, false, 'Card on file'),
          (${EBENI_USER_ID}, ${marcus},   'ISO 9001 Internal Auditor',               'certificate', 'BSI Training',            '2023-03-10', '2026-03-10', 'active', false, true,  'Audited 2 internal audits since cert'),
          (${EBENI_USER_ID}, ${marcus},   'Incident Investigation Methodology',      'training',    'NSC Online',              '2023-09-01', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${marcus},   'OSHA Recordkeeping (29 CFR 1904)',         'training',   'OSHA.gov e-Tools',        '2024-01-15', NULL,         'active', false, true,  'Verified: completed quarterly 300 log review'),
          (${EBENI_USER_ID}, ${diana},    'Analytical Chemistry (ASTM D3306)',        'diploma',    'Ohio State University',   '2015-05-01', NULL,         'active', false, false, 'B.S. Chemistry'),
          (${EBENI_USER_ID}, ${diana},    'REACH / SDS Authoring',                   'training',   'SOCMA Training',          '2023-11-01', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${diana},    'Formulation Development (DOT 3/4)',        'experience', 'CCI Chemical, Inc.',      '2017-07-01', NULL,         'active', true,  true,  'OJT verified by VP Operations after 6-month review'),
          (${EBENI_USER_ID}, ${james},    'Workplace Safety Orientation',            'certificate', 'CCI Internal',            '2021-01-12', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${james},    'Chemical Blending WI-003 (Batch Mixing)', 'ojt',         'Diana Torres',            '2021-03-01', NULL,         'active', true,  true,  'OJT sign-off sheet on file; 30-day review completed'),
          (${EBENI_USER_ID}, ${james},    'Hazard Communication / GHS',              'certificate', 'CCI Internal',            '2024-01-10', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${aisha},    'Workplace Safety Orientation',            'certificate', 'CCI Internal',            '2020-06-24', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${aisha},    'Filling Line Operation WI-007',           'ojt',         'Roberto Sanchez',         '2020-08-15', NULL,         'active', true,  true,  NULL),
          (${EBENI_USER_ID}, ${aisha},    'Hazard Communication / GHS',              'certificate', 'CCI Internal',            '2023-12-05', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${roberto},  'Workplace Safety Orientation',            'certificate', 'CCI Internal',            '2020-09-07', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${roberto},  'Forklift Safety (OSHA)',                  'certificate', 'Toyota Industrial',       '2023-05-20', '2026-05-20', 'active', false, false, 'Cert expires 2026-05-20'),
          (${EBENI_USER_ID}, ${brittany}, 'GD&T Fundamentals',                       'training',   'ASME Online',             '2023-04-01', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${brittany}, 'Statistical Process Control (SPC)',        'training',   'AIAG Learning',           '2023-07-15', NULL,         'active', false, true,  'Applied SPC charts to DOT 3 viscosity control'),
          (${EBENI_USER_ID}, ${brittany}, 'Measurement System Analysis (MSA)',        'training',   'AIAG Learning',           '2023-09-10', NULL,         'active', false, false, NULL),
          (${EBENI_USER_ID}, ${brittany}, 'PPAP Documentation',                       'ojt',        'Diana Torres',            '2024-01-05', NULL,         'active', true,  true,  NULL),
          (${EBENI_USER_ID}, ${devon},    'Lockout/Tagout (LOTO) - OSHA 1910.147',   'certificate','OSHA Training Institute', '2022-10-01', '2025-10-01', 'active', false, false, 'Annual renewal required'),
          (${EBENI_USER_ID}, ${devon},    'Preventive Maintenance Procedures (PM-001)','ojt',       'Plant Manager',           '2019-01-15', NULL,         'active', true,  true,  NULL),
          (${EBENI_USER_ID}, ${trevor},   'Lockout/Tagout (LOTO) - OSHA 1910.147',   'certificate','OSHA Training Institute', '2023-02-15', '2026-02-15', 'active', false, false, NULL),
          (${EBENI_USER_ID}, ${trevor},   'Electrical Safety (NFPA 70E)',             'certificate','NFPA Online',             '2023-06-01', '2026-06-01', 'active', false, false, NULL)
      `);
      console.log("[training-seed] Inserted employee competency records.");
    } else if (crCount > 0) {
      console.log(`[training-seed] Competency records already present (${crCount} rows) — skipping.`);
    }

    // ── Step 4: Training Event Records ────────────────────────────────────────
    const evRes = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM training_event_records WHERE user_id = ${EBENI_USER_ID}
    `);
    const evCount = Number((evRes.rows[0] as any).cnt);
    if (evCount === 0 && marcus && diana && james && aisha && roberto && brittany && devon && carlos && angela && trevor && latoya && priya) {
      const all12  = JSON.stringify([marcus, diana, james, aisha, roberto, brittany, devon, priya, carlos, angela, trevor, latoya]);
      const prod4  = JSON.stringify([james, aisha, roberto, latoya]);
      const maint2 = JSON.stringify([devon, trevor]);
      const qual3  = JSON.stringify([marcus, brittany, diana]);
      await db.execute(sql`
        INSERT INTO training_event_records (user_id, title, training_type, standard, clause, trainer, provider, training_date, duration_hours, location, participants, passed, notes)
        VALUES
          (${EBENI_USER_ID}, 'Annual Workplace Safety Orientation — 2024',  'classroom',    'ISO 45001:2018',  '7.2',       'Marcus Webb',          'CCI Internal',     '2024-01-12', '4',   'Main Conference Room',         ${all12}::jsonb,                           true, 'All 12 employees completed. Sign-off sheets filed.'),
          (${EBENI_USER_ID}, 'Hazard Communication / GHS Refresher',        'classroom',    'OSHA',            '1910.1200', 'Marcus Webb',          'CCI Internal',     '2024-02-08', '2',   'Production Floor',             ${prod4}::jsonb,                           true, 'SDS binder updated same day.'),
          (${EBENI_USER_ID}, 'LOTO Refresher — OSHA 1910.147',              'classroom',    'OSHA',            '1910.147',  'Marcus Webb',          'CCI Internal',     '2024-03-15', '3',   'Maintenance Break Room',       ${maint2}::jsonb,                          true, 'Hands-on verification completed.'),
          (${EBENI_USER_ID}, 'IATF 16949 Internal Auditor Awareness',       'classroom',    'IATF 16949:2016', '7.2',       'Elena Vasquez',        'BSI Training',     '2023-11-10', '8',   'Off-site — BSI Dayton',        ${qual3}::jsonb,                           true, 'Marcus obtained full auditor cert. Others received awareness.'),
          (${EBENI_USER_ID}, 'SPC & MSA Fundamentals Workshop',             'classroom',    'IATF 16949:2016', '7.2',       'Diana Torres',         'AIAG',             '2023-09-20', '6',   'Training Room B',              ${JSON.stringify([brittany, diana])}::jsonb,true, 'Pre-work completed online; hands-on gauge R&R exercise.'),
          (${EBENI_USER_ID}, 'Forklift Safety Recertification',             'classroom',    'OSHA',            '1910.178',  'Toyota Industrial Rep','Toyota Industrial','2023-05-19', '4',   'Warehouse / Loading Dock',     ${JSON.stringify([carlos, roberto])}::jsonb,true, 'Practical driving test completed. Certs issued.'),
          (${EBENI_USER_ID}, 'Chemical Blending OJT - Batch Mixing (WI-003)','ojt',         'IATF 16949:2016','7.2.2',     'Diana Torres',         'CCI Internal',     '2021-03-01', '8',   'Blending Operations Area',     ${JSON.stringify([james])}::jsonb,          true, 'OJT effectiveness verified at 30-day follow-up.'),
          (${EBENI_USER_ID}, 'Toolbox Talk — Slip, Trip & Fall Prevention', 'toolbox_talk', 'ISO 45001:2018',  '7.3',       'Marcus Webb',          'CCI Internal',     '2024-04-05', '0.5', 'Production Floor Huddle Area', ${all12}::jsonb,                           true, 'Monthly toolbox talk. Attendance confirmed.')
      `);
      console.log("[training-seed] Inserted 8 training event records.");
    } else if (evCount > 0) {
      console.log(`[training-seed] Training event records already present (${evCount} rows) — skipping.`);
    }

    // ── Step 5: Training Assignments (LMS) ───────────────────────────────────
    const taRes = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM training_assignments WHERE employer_user_id = ${EBENI_USER_ID}
    `);
    const taCount = Number((taRes.rows[0] as any).cnt);
    if (taCount === 0 && marcus && diana && james && aisha && roberto && brittany && devon && carlos && angela && trevor && latoya) {
      const courseCheckRes = await db.execute(sql`
        SELECT id FROM courses WHERE id IN (4, 5, 6, 7, 8, 9, 10)
      `);
      const availCourseIds = new Set((courseCheckRes.rows as any[]).map((r: any) => Number(r.id)));

      const assignments = [
        { empId: marcus,   courseId: 6, status: 'completed',   progress: 100, daysAgo: 90,  doneAgo: 85  as number | null },
        { empId: diana,    courseId: 6, status: 'completed',   progress: 100, daysAgo: 90,  doneAgo: 84  as number | null },
        { empId: james,    courseId: 6, status: 'completed',   progress: 100, daysAgo: 90,  doneAgo: 83  as number | null },
        { empId: aisha,    courseId: 6, status: 'in_progress', progress: 60,  daysAgo: 45,  doneAgo: null },
        { empId: roberto,  courseId: 6, status: 'assigned',    progress: 0,   daysAgo: 10,  doneAgo: null },
        { empId: carlos,   courseId: 6, status: 'assigned',    progress: 0,   daysAgo: 10,  doneAgo: null },
        { empId: james,    courseId: 9, status: 'completed',   progress: 100, daysAgo: 60,  doneAgo: 55  as number | null },
        { empId: aisha,    courseId: 9, status: 'completed',   progress: 100, daysAgo: 60,  doneAgo: 54  as number | null },
        { empId: roberto,  courseId: 9, status: 'in_progress', progress: 40,  daysAgo: 20,  doneAgo: null },
        { empId: latoya,   courseId: 9, status: 'assigned',    progress: 0,   daysAgo: 5,   doneAgo: null },
        { empId: marcus,   courseId: 7, status: 'completed',   progress: 100, daysAgo: 80,  doneAgo: 78  as number | null },
        { empId: angela,   courseId: 7, status: 'completed',   progress: 100, daysAgo: 80,  doneAgo: 77  as number | null },
        { empId: diana,    courseId: 7, status: 'in_progress', progress: 75,  daysAgo: 30,  doneAgo: null },
        { empId: brittany, courseId: 7, status: 'assigned',    progress: 0,   daysAgo: 7,   doneAgo: null },
        { empId: marcus,   courseId: 4, status: 'completed',   progress: 100, daysAgo: 120, doneAgo: 118 as number | null },
        { empId: carlos,   courseId: 4, status: 'completed',   progress: 100, daysAgo: 120, doneAgo: 117 as number | null },
        { empId: angela,   courseId: 4, status: 'in_progress', progress: 50,  daysAgo: 25,  doneAgo: null },
        { empId: marcus,   courseId: 5, status: 'completed',   progress: 100, daysAgo: 100, doneAgo: 97  as number | null },
        { empId: angela,   courseId: 5, status: 'in_progress', progress: 30,  daysAgo: 15,  doneAgo: null },
        { empId: james,    courseId: 10, status: 'completed',  progress: 100, daysAgo: 70,  doneAgo: 68  as number | null },
        { empId: aisha,    courseId: 10, status: 'completed',  progress: 100, daysAgo: 70,  doneAgo: 67  as number | null },
        { empId: roberto,  courseId: 10, status: 'assigned',   progress: 0,   daysAgo: 5,   doneAgo: null },
        { empId: devon,    courseId: 8, status: 'completed',   progress: 100, daysAgo: 50,  doneAgo: 48  as number | null },
        { empId: trevor,   courseId: 8, status: 'in_progress', progress: 80,  daysAgo: 20,  doneAgo: null },
      ].filter(a => availCourseIds.has(a.courseId));

      let inserted = 0;
      for (const a of assignments) {
        if (a.doneAgo !== null) {
          await db.execute(sql`
            INSERT INTO training_assignments (employer_user_id, employee_id, course_id, status, progress, assigned_at, completed_at)
            VALUES (${EBENI_USER_ID}, ${a.empId}, ${a.courseId}, ${a.status}, ${a.progress},
                    NOW() - (${String(a.daysAgo)} || ' days')::interval,
                    NOW() - (${String(a.doneAgo)} || ' days')::interval)
          `);
        } else {
          await db.execute(sql`
            INSERT INTO training_assignments (employer_user_id, employee_id, course_id, status, progress, assigned_at)
            VALUES (${EBENI_USER_ID}, ${a.empId}, ${a.courseId}, ${a.status}, ${a.progress},
                    NOW() - (${String(a.daysAgo)} || ' days')::interval)
          `);
        }
        inserted++;
      }
      console.log(`[training-seed] Inserted ${inserted} training assignment records.`);
    } else if (taCount > 0) {
      console.log(`[training-seed] Training assignments already present (${taCount} rows) — skipping.`);
    }

    console.log("[training-seed] ✓ CCI Chemical training demo data verified.");
  } catch (err: any) {
    console.error("[training-seed] Seed error:", err.message);
  }
}
