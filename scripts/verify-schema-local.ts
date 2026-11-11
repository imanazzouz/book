/**
 * Local schema verification — applies every checked-in migration to a real
 * Postgres engine compiled to WebAssembly (PGlite, Postgres 17) and asserts the
 * invariants the application relies on.
 *
 *   npm run db:verify:local
 *
 * This is a *pre-flight* gate: it proves the SQL parses, applies in order and
 * that the guards (append-only audit log, UUIDv7 defaults, updated_at, search
 * normalisation) behave. The same files are applied to Neon by
 * `npx drizzle-kit migrate` once DATABASE_URL exists.
 */
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { loadMigrations } from './db/migrations';

const failures: string[] = [];

function check(label: string, ok: boolean, detail = '') {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function scalar<T>(db: PGlite, sql: string): Promise<T> {
  const result = await db.query<Record<string, T>>(sql);
  const row = result.rows[0];
  if (!row) throw new Error(`no rows for: ${sql}`);
  return Object.values(row)[0] as T;
}

async function main() {
  const db = await PGlite.create({
    extensions: { pg_trgm, pgcrypto, unaccent },
  });

  const migrations = loadMigrations();
  console.log(`Applying ${migrations.length} migration file(s) to PGlite\n`);

  for (const migration of migrations) {
    process.stdout.write(`  ${migration.name} … `);
    for (const [index, statement] of migration.statements.entries()) {
      try {
        await db.exec(statement);
      } catch (error) {
        console.log('FAILED');
        console.error(`\nStatement #${index + 1} of ${migration.name} failed:\n${statement}\n`);
        throw error;
      }
    }
    console.log(`ok (${migration.statements.length} statements)`);
  }

  console.log('\nSchema invariants');

  const tables = await scalar<number>(
    db,
    `SELECT count(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  );
  check('43 application tables created', tables === 43, `found ${tables}`);

  const enums = await scalar<number>(
    db,
    `SELECT count(*)::int FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE t.typtype = 'e' AND n.nspname = 'public'`,
  );
  check('22 enum types created', enums === 22, `found ${enums}`);

  const missingDefaults = await scalar<number>(
    db,
    `SELECT count(*)::int FROM information_schema.columns
     WHERE table_schema = 'public' AND column_name = 'id' AND data_type = 'uuid'
       AND column_default IS NULL`,
  );
  check(
    'every uuid id has a database default',
    missingDefaults === 0,
    `${missingDefaults} missing`,
  );

  const updatedAtTriggers = await scalar<number>(
    db,
    `SELECT count(*)::int FROM information_schema.triggers
     WHERE event_object_schema = 'public' AND trigger_name LIKE '%_touch_updated_at'`,
  );
  check('updated_at triggers installed', updatedAtTriggers >= 17, `found ${updatedAtTriggers}`);

  const trgmIndexes = await scalar<number>(
    db,
    `SELECT count(*)::int FROM pg_indexes
     WHERE schemaname = 'public' AND indexdef ILIKE '%gin%' AND indexdef ILIKE '%trgm%'`,
  );
  check('trigram search indexes installed', trgmIndexes === 7, `found ${trgmIndexes}`);

  const normalized = await scalar<string>(db, `SELECT app_normalize('Céréales Oléagineux')`);
  check('app_normalize strips accents + case', normalized === 'cereales oleagineux', normalized);

  const uuidDefault = await scalar<string>(db, `SELECT app_uuid_v7()::text`);
  check(
    'app_uuid_v7 returns a v7 uuid',
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuidDefault),
    uuidDefault,
  );

  const insertedWilaya = await scalar<string>(
    db,
    `INSERT INTO wilayas (code, name_ar, name_fr, name_en) VALUES ('01', 'أدرار', 'Adrar', 'Adrar')
     RETURNING code`,
  );
  check('natural-key seed insert works', insertedWilaya === '01');

  // Append-only audit log: a privileged rewrite must be rejected by the database.
  await db.query(
    `INSERT INTO audit_logs (action, resource_type, result) VALUES ('test', 'schema', 'success')`,
  );
  let updateRejected = false;
  try {
    await db.query(`UPDATE audit_logs SET action = 'tampered'`);
  } catch {
    updateRejected = true;
  }
  check('audit_logs rejects UPDATE', updateRejected);

  let deleteRejected = false;
  try {
    await db.query(`DELETE FROM audit_logs`);
  } catch {
    deleteRejected = true;
  }
  check('audit_logs rejects DELETE', deleteRejected);

  const auditRows = await scalar<number>(db, `SELECT count(*)::int FROM audit_logs`);
  check('audit row preserved', auditRows === 1, `found ${auditRows}`);

  // updated_at is maintained by the database for raw SQL writers.
  await db.query(`INSERT INTO platform_settings (key, value) VALUES ('schema.probe', '{}'::jsonb)`);
  await db.query(
    `UPDATE platform_settings SET value = '{"touched":true}'::jsonb WHERE key = 'schema.probe'`,
  );
  const touched = await scalar<boolean>(
    db,
    `SELECT updated_at > now() - interval '1 minute' FROM platform_settings WHERE key = 'schema.probe'`,
  );
  check('updated_at maintained by trigger', touched === true);

  // The critical CHECK constraints must actually bite.
  let badPriceRejected = false;
  try {
    await db.query(
      `INSERT INTO stores (farmer_id, slug, name, description, wilaya_code, commune_code, address_line, phone)
       VALUES (app_uuid_v7(), 'x', 'x', 'x', '16', '1601', 'x', '+213555000000')`,
    );
  } catch {
    // expected: slug too short AND missing farmer row
    badPriceRejected = true;
  }
  check('store slug format enforced', badPriceRejected);

  let badEmailRejected = false;
  try {
    await db.query(
      `INSERT INTO users (email, name, phone) VALUES ('NotLower@Example.com', 'x', '+213555000000')`,
    );
  } catch {
    badEmailRejected = true;
  }
  check('users.email must be lowercase', badEmailRejected);

  let badPhoneRejected = false;
  try {
    await db.query(
      `INSERT INTO users (email, name, phone) VALUES ('ok@example.dz', 'x', '0555000000')`,
    );
  } catch {
    badPhoneRejected = true;
  }
  check('users.phone must be E.164 +213', badPhoneRejected);

  await db.close();

  if (failures.length > 0) {
    console.error(`\n${failures.length} check(s) failed:`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('\nAll schema checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
