/**
 * Executes the project SQL migrations against an in-process Postgres engine.
 *
 * Used by `npm run db:verify:local` so the migration SQL is proven to apply
 * before it ever reaches Neon. This module is intentionally dependency-free
 * (no drizzle-kit, no network) and only reads the checked-in `.sql` files.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface MigrationFile {
  name: string;
  statements: string[];
}

const BREAKPOINT = '--> statement-breakpoint';

export function loadMigrations(dir = 'drizzle'): MigrationFile[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((name) => ({
      name,
      statements: readFileSync(join(dir, name), 'utf8')
        .split(BREAKPOINT)
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0),
    }));
}
