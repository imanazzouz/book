/**
 * Creates the first super admin — idempotently and without a password.
 *
 *   ADMIN_EMAIL=you@example.dz npm run admin:create
 *
 * Login happens through Google OAuth or a hashed e-mail OTP, so this script only
 * provisions the account and its role. Every invocation is written to the
 * append-only audit log. The logic lives in `ensureSuperAdmin` so it is covered
 * by the integration suite.
 */
import { ensureSuperAdmin } from '../src/server/db/admin';
import { closeDb, getDb, isDatabaseConfigured } from '../src/server/db/client';

async function main() {
  const email = process.env.ADMIN_EMAIL ?? process.argv[2] ?? '';
  const name = process.env.ADMIN_NAME ?? process.argv[3] ?? 'Platform administrator';
  const reason = process.env.ADMIN_REASON ?? 'bootstrap: first super admin';

  if (!email || !email.includes('@')) {
    console.error('Usage: ADMIN_EMAIL=you@example.dz npm run admin:create [name]');
    process.exitCode = 1;
    return;
  }
  if (!isDatabaseConfigured()) {
    console.error('DATABASE_URL is missing; cannot create an admin.');
    process.exitCode = 1;
    return;
  }

  const db = getDb();
  try {
    const result = await ensureSuperAdmin(db, { email, name, reason });
    console.log(
      result.created
        ? `Created super admin ${email}`
        : `Promoted existing user ${email} to super_admin`,
    );
    console.log('Audit entry written. Sign in with Google or a one-time e-mail code.');
  } finally {
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
