import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDrizzleCatalogRepository } from '@/server/catalog/drizzle-catalog.repository';
import type { CatalogRepository } from '@/server/catalog/catalog.repository';
import { searchMarket } from '@/server/catalog/use-cases';
import { closeQuietly, type Harness, openHarness } from './helpers/harness';
import { insertFarmerWithStore } from './helpers/fixtures';

describe('Drizzle catalog repository', () => {
  let harness: Harness;
  let repository: CatalogRepository;

  beforeAll(async () => {
    harness = await openHarness();
    await insertFarmerWithStore(harness);
    repository = createDrizzleCatalogRepository(harness.appDb);
  });

  afterAll(async () => {
    await closeQuietly(harness);
  });

  it('lists the 69 official wilayas with localized names', async () => {
    const wilayas = await repository.listWilayas('fr');
    expect(wilayas).toHaveLength(69);
    expect(wilayas[0]).toEqual({ code: '01', name: 'Adrar' });
    expect(wilayas[15]).toEqual({ code: '16', name: 'Alger' });
    expect(wilayas[58]?.code).toBe('59');

    const arabic = await repository.listWilayas('ar');
    expect(arabic[15]?.name).toBe('الجزائر');

    const english = await repository.listWilayas('en');
    expect(english[58]?.name).toBe('Aflou');
  });

  it('counts only published products per category', async () => {
    const categories = await repository.listCategories();
    expect(categories.map((category) => category.slug)).toEqual([
      'vegetables',
      'fruits',
      'dates',
      'grains',
      'oils',
      'legumes',
      'herbs-spices',
      'honey',
    ]);

    const counts = new Map(categories.map((category) => [category.slug, category.productCount]));
    expect(counts.get('vegetables')).toBe(1);
    expect(counts.get('grains')).toBe(1);
    expect(counts.get('fruits')).toBe(0); // the only fruit is still a draft
    expect(counts.get('honey')).toBe(0);
  });

  it('returns published products with store, wilaya and primary image', async () => {
    const page = await repository.listPublishedProducts({ sort: 'newest', page: 1, pageSize: 12 });

    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]?.name).toBe('Céréales — blé dur');

    const tomatoes = page.items.find((item) => item.slug === 'tomates-grappe');
    expect(tomatoes).toMatchObject({
      priceDzd: '120.00',
      unit: 'kg',
      storeName: 'Ferme des Hauts Plateaux',
      storeSlug: 'ferme-hauts-plateaux',
    });
    expect(tomatoes?.image?.url).toBe('/images/editorial/tomatoes.webp');
  });

  it('localizes the wilaya name without touching prices', async () => {
    const [ar] = (
      await repository.listPublishedProducts({ sort: 'newest', page: 1, pageSize: 5 }, 'ar')
    ).items;
    const [fr] = (
      await repository.listPublishedProducts({ sort: 'newest', page: 1, pageSize: 5 }, 'fr')
    ).items;
    const [en] = (
      await repository.listPublishedProducts({ sort: 'newest', page: 1, pageSize: 5 }, 'en')
    ).items;

    expect(ar?.wilayaName).toBe('سطيف');
    expect(fr?.wilayaName).toBe('Sétif');
    expect(en?.wilayaName).toBe('Setif');
    expect(fr?.priceDzd).toBe(ar?.priceDzd);
  });

  it('searches case- and accent-insensitively through the trigram index', async () => {
    const lower = await repository.listPublishedProducts({
      q: 'cereales',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });
    expect(lower.items.map((item) => item.slug)).toEqual(['ble-dur']);

    const accented = await repository.listPublishedProducts({
      q: 'CÉRÉALES',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });
    expect(accented.items.map((item) => item.slug)).toEqual(['ble-dur']);

    const byStore = await repository.listPublishedProducts({
      q: 'hauts plateaux',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });
    expect(byStore.total).toBe(2);
  });

  it('filters by category, wilaya and maximum price', async () => {
    const vegetables = await repository.listPublishedProducts({
      categorySlug: 'vegetables',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });
    expect(vegetables.items.map((item) => item.slug)).toEqual(['tomates-grappe']);

    const wrongWilaya = await repository.listPublishedProducts({
      wilayaCode: '16',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });
    expect(wrongWilaya.total).toBe(0);

    const cheap = await repository.listPublishedProducts({
      maxPriceDzd: '500.00',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });
    expect(cheap.items.map((item) => item.slug)).toEqual(['tomates-grappe']);
  });

  it('sorts by price in both directions', async () => {
    const asc = await repository.listPublishedProducts({
      sort: 'price_asc',
      page: 1,
      pageSize: 12,
    });
    expect(asc.items.map((item) => item.priceDzd)).toEqual(['120.00', '4800.00']);

    const desc = await repository.listPublishedProducts({
      sort: 'price_desc',
      page: 1,
      pageSize: 12,
    });
    expect(desc.items.map((item) => item.priceDzd)).toEqual(['4800.00', '120.00']);
  });

  it('paginates deterministically', async () => {
    const first = await repository.listPublishedProducts({ sort: 'newest', page: 1, pageSize: 1 });
    const second = await repository.listPublishedProducts({ sort: 'newest', page: 2, pageSize: 1 });

    expect(first.items).toHaveLength(1);
    expect(second.items).toHaveLength(1);
    expect(first.total).toBe(2);
    expect(second.total).toBe(2);
    expect(first.items[0]?.id).not.toBe(second.items[0]?.id);

    const beyond = await repository.listPublishedProducts({
      sort: 'newest',
      page: 9,
      pageSize: 12,
    });
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(2);
  });

  it('clamps page size through the use case before hitting the database', async () => {
    const page = await searchMarket(repository, { sort: 'newest', page: 1, pageSize: 5000 }, 'fr');
    expect(page.pageSize).toBe(48);
  });

  it('returns full product detail including stock and images', async () => {
    const product = await repository.findProductBySlug('tomates-grappe', 'fr');
    expect(product).not.toBeNull();
    expect(product?.quantityAvailable).toBe('250.000');
    expect(product?.minOrderQuantity).toBe('1.000');
    expect(product?.categorySlug).toBe('vegetables');
    expect(product?.images).toHaveLength(1);
    expect(product?.images[0]?.alt).toBe('Tomates');
    expect(product?.supportsPickup).toBe(true);
  });

  it('hides draft products and unknown slugs', async () => {
    expect(await repository.findProductBySlug('pommes-brouillon')).toBeNull();
    expect(await repository.findProductBySlug('does-not-exist')).toBeNull();
    expect(await repository.findProductBySlug("' OR 1=1 --")).toBeNull();
  });

  it('returns store detail with its published products only', async () => {
    const store = await repository.findStoreBySlug('ferme-hauts-plateaux', 'fr');
    expect(store).toMatchObject({
      slug: 'ferme-hauts-plateaux',
      wilayaName: 'Sétif',
      communeName: 'Sétif',
      isVerified: true,
    });
    expect(store?.products.map((product) => product.slug).sort()).toEqual([
      'ble-dur',
      'tomates-grappe',
    ]);
  });

  it('hides a suspended store and everything it sells', async () => {
    await harness.sql(
      `UPDATE stores SET status = 'suspended', suspended_reason = 'test' WHERE slug = 'ferme-hauts-plateaux'`,
    );

    expect(await repository.findStoreBySlug('ferme-hauts-plateaux')).toBeNull();
    expect(await repository.findProductBySlug('tomates-grappe')).toBeNull();

    const page = await repository.listPublishedProducts({ sort: 'newest', page: 1, pageSize: 12 });
    expect(page.total).toBe(0);

    const categories = await repository.listCategories();
    expect(categories.every((category) => category.productCount === 0)).toBe(true);

    // Restoring the store restores visibility — suspension is the only reason.
    await harness.sql(
      `UPDATE stores SET status = 'active', suspended_reason = NULL WHERE slug = 'ferme-hauts-plateaux'`,
    );
    expect(await repository.findProductBySlug('tomates-grappe')).not.toBeNull();
  });
});
