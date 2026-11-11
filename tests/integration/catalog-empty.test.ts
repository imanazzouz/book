import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDrizzleCatalogRepository } from '@/server/catalog/drizzle-catalog.repository';
import type { CatalogRepository } from '@/server/catalog/catalog.repository';
import { closeQuietly, type Harness, openHarness } from './helpers/harness';

/**
 * The launch database is empty by design: reference data only. This file proves
 * the public read path returns honest empty results instead of failing.
 */
describe('empty catalog', () => {
  let harness: Harness;
  let repository: CatalogRepository;

  beforeAll(async () => {
    harness = await openHarness();
    repository = createDrizzleCatalogRepository(harness.appDb);
  });

  afterAll(async () => {
    await closeQuietly(harness);
  });

  it('returns an empty page, not an error', async () => {
    const page = await repository.listPublishedProducts({ sort: 'newest', page: 1, pageSize: 12 });
    expect(page).toEqual({ items: [], total: 0, page: 1, pageSize: 12 });
  });

  it('returns the seeded categories with zero products', async () => {
    const categories = await repository.listCategories();
    expect(categories).toHaveLength(8);
    expect(categories.every((category) => category.productCount === 0)).toBe(true);
  });

  it('returns the 69 wilayas for the filters', async () => {
    expect(await repository.listWilayas('fr')).toHaveLength(69);
  });

  it('returns null for products and stores that do not exist', async () => {
    expect(await repository.findProductBySlug('tomates-grappe')).toBeNull();
    expect(await repository.findStoreBySlug('ferme-hauts-plateaux')).toBeNull();
  });
});
