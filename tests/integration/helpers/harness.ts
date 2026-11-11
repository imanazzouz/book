import type { AnyDatabase } from '@/server/db/types';
import { seedDatabase } from '@/server/db/seed';
import { createTestDatabase, type TestDatabase } from './database';

export interface Harness extends TestDatabase {
  /** The same object the repository expects, structurally. */
  appDb: AnyDatabase;
  sql: <T>(query: string) => Promise<T[]>;
}

export async function openHarness({ seeded = true }: { seeded?: boolean } = {}): Promise<Harness> {
  const testDb = await createTestDatabase();

  if (seeded) await seedDatabase(testDb.db);

  return {
    ...testDb,
    appDb: testDb.db,
    sql: testDb.query,
  };
}

export async function closeQuietly(harness: Harness | undefined): Promise<void> {
  if (harness) await harness.close();
}

export async function countOf(harness: Harness, table: string): Promise<number> {
  const rows = await harness.sql<{ count: number }>(`SELECT count(*)::int AS count FROM ${table}`);
  return rows[0]?.count ?? -1;
}
