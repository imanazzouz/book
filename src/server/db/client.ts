import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

/**
 * One pool and one Drizzle instance per process. Next.js reloads modules in dev,
 * so the instances are cached on `globalThis` to avoid leaking connections and
 * exhausting the Neon connection limit.
 */
const cache = globalThis as unknown as {
  __agridirectDb?: AppDatabase | undefined;
  __agridirectPool?: Pool | undefined;
};

export type AppDatabase = NodePgDatabase<typeof schema> & { $client: Pool };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and paste the Neon connection string.',
    );
  }
  return url;
}

function resolveSsl(): PoolConfig['ssl'] {
  const mode = (process.env.DATABASE_SSL ?? 'auto').toLowerCase();
  if (mode === 'disable' || mode === 'false') return false;
  if (getDatabaseUrl().includes('sslmode=')) return undefined;
  return { rejectUnauthorized: true };
}

function createPool(): Pool {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    max: Number.parseInt(process.env.DATABASE_POOL_MAX ?? '5', 10),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    // Neon requires TLS. `sslmode=` in the URL is honoured by pg; for URLs that
    // omit it we pass an explicit ssl object. `DATABASE_SSL=disable` is only for
    // the local Postgres used by `npm run db:local`.
    ssl: resolveSsl(),
    application_name: 'agridirect-web',
  });

  // Without this handler an idle client error would crash the process.
  pool.on('error', (error) => {
    console.error('[db] idle client error', error);
  });

  return pool;
}

export function getDb(): AppDatabase {
  if (cache.__agridirectDb) return cache.__agridirectDb;

  const pool = createPool();
  const db = drizzle(pool, { schema, casing: 'snake_case' });
  cache.__agridirectPool = pool;
  cache.__agridirectDb = db;
  return db;
}

export async function closeDb(): Promise<void> {
  const pool = cache.__agridirectPool;
  cache.__agridirectDb = undefined;
  cache.__agridirectPool = undefined;
  if (pool) await pool.end();
}
