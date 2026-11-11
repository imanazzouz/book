import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDatabase } from '@/server/db/seed';
import { closeQuietly, countOf, type Harness, openHarness } from './helpers/harness';

describe('platform seed', () => {
  let harness: Harness;

  beforeAll(async () => {
    harness = await openHarness();
    await seedDatabase(harness.db);
  });

  afterAll(async () => {
    await closeQuietly(harness);
  });

  it('seeds the 69 official wilayas from the Journal Officiel source', async () => {
    expect(await countOf(harness, 'wilayas')).toBe(69);
  });

  it('seeds all 1 541 communes, each attached to a real wilaya', async () => {
    expect(await countOf(harness, 'communes')).toBe(1541);

    const orphans = await harness.sql<{ count: number }>(`
      SELECT count(*)::int AS count FROM communes c
      LEFT JOIN wilayas w ON w.code = c.wilaya_code
      WHERE w.code IS NULL
    `);
    expect(orphans[0]?.count).toBe(0);
  });

  it('marks the 11 wilayas created by Law 26-06', async () => {
    const rows = await harness.sql<{ code: string }>(
      `SELECT code FROM wilayas WHERE is_new_wilaya ORDER BY code`,
    );
    expect(rows.map((row) => row.code)).toEqual([
      '59',
      '60',
      '61',
      '62',
      '63',
      '64',
      '65',
      '66',
      '67',
      '68',
      '69',
    ]);
  });

  it('stores the known daira gap for Algiers instead of inventing codes', async () => {
    const rows = await harness.sql<{ count: number }>(
      `SELECT count(*)::int AS count FROM communes WHERE wilaya_code = '16' AND daira_code IS NULL`,
    );
    expect(rows[0]?.count).toBe(57);
  });

  it('seeds the bootstrap taxonomy, roles, permissions and delivery methods', async () => {
    expect(await countOf(harness, 'categories')).toBe(8);
    expect(await countOf(harness, 'roles')).toBe(4);
    expect(await countOf(harness, 'permissions')).toBe(14);
    expect(await countOf(harness, 'delivery_methods')).toBe(3);
    expect(await countOf(harness, 'platform_settings')).toBe(6);

    const farmerGrants = await harness.sql<{ count: number }>(
      `SELECT count(*)::int AS count FROM role_permissions WHERE role_code = 'farmer'`,
    );
    expect(farmerGrants[0]?.count).toBe(3);

    const critical = await harness.sql<{ count: number }>(
      `SELECT count(*)::int AS count FROM permissions WHERE is_critical`,
    );
    expect(critical[0]?.count).toBe(3);
  });

  it('creates no business data at all', async () => {
    for (const table of [
      'users',
      'user_profiles',
      'farmer_profiles',
      'stores',
      'products',
      'product_images',
      'orders',
      'order_items',
      'reviews',
      'payments',
      'notifications',
      'audit_logs',
    ]) {
      expect(await countOf(harness, table), table).toBe(0);
    }
  });

  it('is idempotent: a second run changes nothing', async () => {
    await seedDatabase(harness.db);

    expect(await countOf(harness, 'wilayas')).toBe(69);
    expect(await countOf(harness, 'communes')).toBe(1541);
    expect(await countOf(harness, 'categories')).toBe(8);
    expect(await countOf(harness, 'role_permissions')).toBe(26);
  });

  it('keeps operator-edited settings when re-run', async () => {
    await harness.sql(
      `UPDATE platform_settings SET value = '30'::jsonb WHERE key = 'platform.fee_percent'`,
    );
    await seedDatabase(harness.db);

    const rows = await harness.sql<{ value: string }>(
      `SELECT value::text AS value FROM platform_settings WHERE key = 'platform.fee_percent'`,
    );
    expect(rows[0]?.value).toBe('30');
  });
});
