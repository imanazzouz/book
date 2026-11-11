import { sql } from 'drizzle-orm';
import type { AnyDatabase } from './types';

export interface DatabaseCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface DatabaseReport {
  ok: boolean;
  checks: DatabaseCheck[];
}

export interface InspectOptions {
  /**
   * A launched marketplace has exactly one bootstrap super admin. With this flag
   * the `users` check tolerates that single account (and nothing else).
   */
  allowBootstrapAdmin?: boolean;
}

/** Tables that must stay empty until real people sign up and trade. */
const BUSINESS_TABLES = [
  'users',
  'farmer_profiles',
  'stores',
  'products',
  'product_images',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'payments',
  'reviews',
  'disputes',
  'media_assets',
] as const;

/** Reference tables and the count the official sources mandate. */
const REFERENCE_COUNTS: readonly (readonly [string, number])[] = [
  ['wilayas', 69],
  ['communes', 1541],
  ['categories', 8],
  ['roles', 4],
  ['permissions', 14],
  ['delivery_methods', 3],
];

const EXPECTED_TABLES = 43;
const EXPECTED_ENUMS = 22;

async function rawRows<T>(db: AnyDatabase, query: ReturnType<typeof sql>): Promise<T[]> {
  const result = (await db.execute(query)) as unknown as { rows: T[] };
  return result.rows ?? [];
}

async function countRows(db: AnyDatabase, table: string): Promise<number> {
  const [row] = await rawRows<{ count: number }>(
    db,
    sql`SELECT count(*)::int AS count FROM ${sql.identifier(table)}`,
  );
  return row?.count ?? -1;
}

/**
 * Structural + data audit of a database. Used by `npm run db:verify` against
 * Neon, and by the integration suite against the test engine, so the "empty of
 * business data" promise is machine-checked rather than asserted in prose.
 */
export async function inspectDatabase(
  db: AnyDatabase,
  { allowBootstrapAdmin = false }: InspectOptions = {},
): Promise<DatabaseReport> {
  const checks: DatabaseCheck[] = [];

  const [tableRow] = await rawRows<{ count: number }>(
    db,
    sql`SELECT count(*)::int AS count FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE '__drizzle%'`,
  );
  checks.push({
    name: `schema has ${EXPECTED_TABLES} tables`,
    ok: tableRow?.count === EXPECTED_TABLES,
    detail: `found ${tableRow?.count ?? 'none'}`,
  });

  const [enumRow] = await rawRows<{ count: number }>(
    db,
    sql`SELECT count(*)::int AS count FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typtype = 'e' AND n.nspname = 'public'`,
  );
  checks.push({
    name: `schema has ${EXPECTED_ENUMS} enum types`,
    ok: enumRow?.count === EXPECTED_ENUMS,
    detail: `found ${enumRow?.count ?? 'none'}`,
  });

  const [defaultRow] = await rawRows<{ count: number }>(
    db,
    sql`SELECT count(*)::int AS count FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'id' AND data_type = 'uuid'
          AND column_default IS NULL`,
  );
  checks.push({
    name: 'every uuid id has a uuidv7 default',
    ok: defaultRow?.count === 0,
    detail: `${defaultRow?.count ?? '?'} without default`,
  });

  const [triggerRow] = await rawRows<{ count: number }>(
    db,
    sql`SELECT count(*)::int AS count FROM information_schema.triggers
        WHERE event_object_schema = 'public' AND trigger_name = 'audit_logs_append_only'`,
  );
  // information_schema lists one row per (trigger, event): UPDATE and DELETE.
  const appendOnlyRows = triggerRow?.count ?? 0;
  checks.push({
    name: 'audit_logs is append-only',
    ok: appendOnlyRows >= 2,
    detail: appendOnlyRows >= 2 ? 'trigger installed' : 'trigger missing',
  });

  const [extensionRow] = await rawRows<{ installed: number }>(
    db,
    sql`SELECT count(*)::int AS installed FROM pg_extension
        WHERE extname IN ('pgcrypto', 'pg_trgm', 'unaccent')`,
  );
  checks.push({
    name: 'required extensions installed',
    ok: extensionRow?.installed === 3,
    detail: `${extensionRow?.installed ?? 0}/3`,
  });

  for (const [name, expected] of REFERENCE_COUNTS) {
    const actual = await countRows(db, name);
    checks.push({
      name: `${name} seeded (${expected})`,
      ok: actual === expected,
      detail: `found ${actual}`,
    });
  }

  for (const name of BUSINESS_TABLES) {
    const actual = await countRows(db, name);
    let ok = actual === 0;
    let detail = `found ${actual}`;

    if (!ok && name === 'users' && allowBootstrapAdmin) {
      const [bootstrap] = await rawRows<{ count: number }>(
        db,
        sql`SELECT count(*)::int AS count FROM users WHERE primary_role = 'super_admin'`,
      );
      ok = actual === 1 && bootstrap?.count === 1;
      detail = ok ? 'one bootstrap super admin' : `found ${actual} (only one super admin allowed)`;
    }

    checks.push({ name: `${name} empty`, ok, detail });
  }

  const auditCount = await countRows(db, 'audit_logs');
  checks.push({
    name: 'audit trail readable',
    ok: auditCount >= 0,
    detail: `${auditCount} entries`,
  });

  return { ok: checks.every((check) => check.ok), checks };
}

export function formatReport(report: DatabaseReport): string {
  const lines = report.checks.map(
    (check) => `  ${check.ok ? '✓' : '✗'} ${check.name} — ${check.detail}`,
  );
  return [`${report.ok ? 'Database looks correct.' : 'Database problems found:'}`, ...lines].join(
    '\n',
  );
}
