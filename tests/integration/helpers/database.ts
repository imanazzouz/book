/**
 * Integration-test database.
 *
 * Default: the real migrations are applied to PGlite — Postgres 17 compiled to
 * WebAssembly — so SQL, constraints, triggers and Drizzle queries are genuinely
 * executed rather than mocked.
 *
 * With `TEST_DATABASE_URL` set (a disposable Neon branch, or `npm run db:local`),
 * the same suite runs against that server instead: `public` is dropped and
 * rebuilt from the same migration files, so the two paths cannot drift.
 */
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/server/db/schema';
import type { AnyDatabase } from '@/server/db/types';
import { loadMigrations } from '../../../scripts/db/migrations';

export type TestDatabase = {
  /** The same query surface the production repository uses. */
  db: AnyDatabase;
  /** Raw SQL escape hatch for assertions that need information_schema. */
  query: <T>(statement: string) => Promise<T[]>;
  engine: 'pglite' | 'postgres';
  close: () => Promise<void>;
};

async function applyMigrations(run: (statement: string) => Promise<unknown>) {
  for (const migration of loadMigrations()) {
    for (const statement of migration.statements) {
      await run(statement);
    }
  }
}

async function createPglite(): Promise<TestDatabase> {
  const pglite = await PGlite.create({ extensions: { pg_trgm, pgcrypto, unaccent } });
  await applyMigrations((statement) => pglite.exec(statement));

  const db = drizzle(pglite, { schema, casing: 'snake_case' }) as unknown as AnyDatabase;

  return {
    db,
    engine: 'pglite',
    query: async <T>(statement: string) => {
      const result = await pglite.query<T>(statement);
      return result.rows;
    },
    close: () => pglite.close(),
  };
}

/**
 * One pool for the whole process: the local Postgres (`npm run db:local`) serves a
 * single client at a time, and reconnecting between files races its cleanup.
 * Each `createPostgres()` call rebuilds `public`, so isolation is preserved.
 */
let sharedPool: Pool | null = null;

function getSharedPool(url: string): Pool {
  if (sharedPool) return sharedPool;
  const sslDisabled = (process.env.DATABASE_SSL ?? 'auto').toLowerCase().startsWith('dis');
  sharedPool = new Pool({
    connectionString: url,
    max: 1,
    ssl: sslDisabled || url.includes('sslmode=') ? undefined : { rejectUnauthorized: true },
  });
  return sharedPool;
}

async function createPostgres(url: string): Promise<TestDatabase> {
  const pool = getSharedPool(url);
  const db = drizzleNode(pool, { schema, casing: 'snake_case' }) as unknown as AnyDatabase;

  // A disposable database only: rebuild `public` from the checked-in migrations.
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await applyMigrations((statement) => db.execute(sql.raw(statement)));

  return {
    db,
    engine: 'postgres',
    query: async <T>(statement: string) => {
      const result = await pool.query(statement);
      return result.rows as T[];
    },
    // The shared pool intentionally outlives individual harnesses; the next
    // harness rebuilds the schema, so no state leaks between files.
    close: async () => {},
  };
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const url = process.env.TEST_DATABASE_URL?.trim();
  return url ? createPostgres(url) : createPglite();
}
