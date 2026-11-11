/**
 * Local Postgres for development and acceptance runs.
 *
 *   npm run db:local          # serves PGlite over the Postgres wire protocol
 *   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres \
 *     DATABASE_SSL=disable npx drizzle-kit migrate
 *
 * This is the *same* Postgres engine the integration tests use, exposed on TCP
 * so the production driver (`pg`), the production migrator (`drizzle-kit`) and
 * the production Next.js server can talk to it exactly as they will to Neon.
 * It is a development tool only; Neon remains the real deployment target.
 */
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const port = Number.parseInt(process.env.PGPORT ?? '55432', 10);
const host = process.env.PGHOST ?? '127.0.0.1';
const dataDir = process.env.PGDATA;

async function main() {
  const db = dataDir
    ? await PGlite.create({ dataDir, extensions: { pg_trgm, pgcrypto, unaccent } })
    : await PGlite.create({ extensions: { pg_trgm, pgcrypto, unaccent } });
  const server = new PGLiteSocketServer({ db, port, host });
  await server.start();
  console.log(
    `Postgres (PGlite) listening on postgresql://postgres:postgres@${host}:${port}/postgres`,
  );
  console.log('Press Ctrl+C to stop. Data lives in memory unless PGDATA is set.');

  const stop = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
