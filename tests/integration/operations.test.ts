import { afterEach, describe, expect, it } from 'vitest';
import { ensureSuperAdmin } from '@/server/db/admin';
import { inspectDatabase } from '@/server/db/verify';
import { closeQuietly, type Harness, openHarness } from './helpers/harness';
import { insertFarmerWithStore } from './helpers/fixtures';

describe('database verification report', () => {
  let harness: Harness | undefined;

  afterEach(async () => {
    await closeQuietly(harness);
    harness = undefined;
  });

  it('passes on a freshly migrated and seeded database', async () => {
    harness = await openHarness();
    const report = await inspectDatabase(harness.appDb);

    const failed = report.checks.filter((check) => !check.ok);
    expect(failed, JSON.stringify(failed, null, 2)).toEqual([]);
    expect(report.ok).toBe(true);

    expect(report.checks.some((check) => check.name === 'wilayas seeded (69)')).toBe(true);
    expect(report.checks.some((check) => check.name === 'communes seeded (1541)')).toBe(true);
  });

  it('fails loudly as soon as business data appears', async () => {
    harness = await openHarness();
    await insertFarmerWithStore(harness);

    const report = await inspectDatabase(harness.appDb);
    expect(report.ok).toBe(false);

    const usersCheck = report.checks.find((check) => check.name === 'users empty');
    expect(usersCheck?.ok).toBe(false);

    const productsCheck = report.checks.find((check) => check.name === 'products empty');
    expect(productsCheck?.ok).toBe(false);
  });

  it('fails when reference data is missing', async () => {
    harness = await openHarness({ seeded: false });

    const report = await inspectDatabase(harness.appDb);
    expect(report.ok).toBe(false);
    expect(report.checks.find((check) => check.name === 'wilayas seeded (69)')?.ok).toBe(false);
    expect(report.checks.find((check) => check.name === 'categories seeded (8)')?.ok).toBe(false);
  });
});

describe('super admin bootstrap', () => {
  let harness: Harness | undefined;

  afterEach(async () => {
    await closeQuietly(harness);
    harness = undefined;
  });

  it('creates an admin once and is idempotent afterwards', async () => {
    harness = await openHarness();

    const first = await ensureSuperAdmin(harness.appDb, { email: 'Admin@AgriDirect.dz' });
    expect(first.created).toBe(true);

    const second = await ensureSuperAdmin(harness.appDb, { email: 'admin@agridirect.dz' });
    expect(second.created).toBe(false);
    expect(second.userId).toBe(first.userId);

    const rows = await harness.sql<{ email: string; primary_role: string; status: string }>(
      `SELECT email, primary_role, status FROM users`,
    );
    expect(rows).toEqual([
      { email: 'admin@agridirect.dz', primary_role: 'super_admin', status: 'active' },
    ]);

    const roles = await harness.sql<{ role_code: string }>(
      `SELECT role_code FROM user_roles WHERE user_id = '${first.userId}'`,
    );
    expect(roles.map((row) => row.role_code)).toEqual(['super_admin']);

    const audit = await harness.sql<{ action: string; actor_role: string; reason: string }>(
      `SELECT action, actor_role, reason FROM audit_logs ORDER BY created_at`,
    );
    expect(audit).toHaveLength(2);
    expect(audit[0]).toMatchObject({ action: 'admin.bootstrap', actor_role: 'super_admin' });
  });

  it('never stores a password or a token for the admin', async () => {
    harness = await openHarness();
    await ensureSuperAdmin(harness.appDb, { email: 'admin@agridirect.dz' });

    const columns = await harness.sql<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
    );
    const names = columns.map((column) => column.column_name);
    expect(names).not.toContain('password');
    expect(names).not.toContain('password_hash');
  });

  it('rejects an invalid email before touching the database', async () => {
    harness = await openHarness();
    await expect(ensureSuperAdmin(harness.appDb, { email: 'not-an-email' })).rejects.toThrow(
      /invalid email/,
    );
  });

  it('refuses to create an admin before roles are seeded', async () => {
    harness = await openHarness({ seeded: false });
    await expect(ensureSuperAdmin(harness.appDb, { email: 'admin@agridirect.dz' })).rejects.toThrow(
      /roles are not seeded/,
    );
  });
});
