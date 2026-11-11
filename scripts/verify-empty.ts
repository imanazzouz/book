/**
 * Verifies a real database (Neon) is migration-complete, seeded with official
 * reference data and still empty of business data.
 *
 *   npm run db:verify
 *
 * Exits non-zero if anything is off, so it can gate a deployment.
 */
import { closeDb, getDb, isDatabaseConfigured } from '../src/server/db/client';
import { formatReport, inspectDatabase } from '../src/server/db/verify';

async function main() {
  if (!isDatabaseConfigured()) {
    console.error('DATABASE_URL is missing; nothing to verify.');
    process.exitCode = 1;
    return;
  }

  const db = getDb();
  try {
    const report = await inspectDatabase(db, {
      allowBootstrapAdmin: process.env.VERIFY_ALLOW_BOOTSTRAP === '1',
    });
    console.log(formatReport(report));
    if (!report.ok) process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
