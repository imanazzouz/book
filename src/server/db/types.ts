import type { PgDatabase } from 'drizzle-orm/pg-core';
import type * as schema from './schema';

/**
 * The query-builder surface shared by the production driver (`node-postgres`)
 * and the in-process Postgres used by tests (PGlite). The result HKT differs
 * between the two, so it is intentionally erased here: every consumer only uses
 * the dialect-agnostic query builder.
 */
export type AnyDatabase = PgDatabase<any, typeof schema>;

/** Narrow alias used in tests and scripts that need a connection handle. */
export type QueryableDatabase = AnyDatabase;
