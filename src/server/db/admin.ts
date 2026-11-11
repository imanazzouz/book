import { eq } from 'drizzle-orm';
import type { AnyDatabase } from './types';
import { auditLogs, roles, userRoles, users } from './schema';

export interface EnsureSuperAdminInput {
  email: string;
  name?: string;
  reason?: string;
}

export interface EnsureSuperAdminResult {
  userId: string;
  created: boolean;
}

/**
 * Provisions (or promotes) the first super admin. No password is ever stored:
 * login is Google OAuth or a hashed e-mail OTP. Idempotent, and every call is
 * recorded in the append-only audit log.
 */
export async function ensureSuperAdmin(
  db: AnyDatabase,
  {
    email,
    name = 'Platform administrator',
    reason = 'bootstrap: first super admin',
  }: EnsureSuperAdminInput,
): Promise<EnsureSuperAdminResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error(`invalid email: ${email}`);

  const [role] = await db.select().from(roles).where(eq(roles.code, 'super_admin')).limit(1);
  if (!role) throw new Error('roles are not seeded — run `npm run db:seed` first');

  const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

  let userId = existing?.id;
  const created = !existing;

  if (!existing) {
    const [inserted] = await db
      .insert(users)
      .values({ email: normalized, name, primaryRole: 'super_admin', emailVerifiedAt: new Date() })
      .returning({ id: users.id });
    if (!inserted) throw new Error('user insert returned no row');
    userId = inserted.id;
  } else {
    await db
      .update(users)
      .set({ primaryRole: 'super_admin', status: 'active', deletedAt: null })
      .where(eq(users.id, existing.id));
  }

  if (!userId) throw new Error('missing user id');

  await db
    .insert(userRoles)
    .values({ userId, roleCode: 'super_admin', grantedBy: userId })
    .onConflictDoNothing();

  await db.insert(auditLogs).values({
    actorUserId: userId,
    actorRole: 'super_admin',
    action: 'admin.bootstrap',
    resourceType: 'user',
    resourceId: userId,
    result: 'success',
    reason,
  });

  return { userId, created };
}
