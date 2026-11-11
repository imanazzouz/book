/**
 * Minimal, deliberately boring fixtures: one farmer, one store, three products.
 * They exist only inside a throwaway test database and never ship to Neon.
 */
import type { TestDatabase } from './database';
import {
  categories,
  communes,
  farmerProfiles,
  inventoryItems,
  productImages,
  products,
  stores,
  users,
  wilayas,
} from '@/server/db/schema';

export const FARMER_EMAIL = 'farmer@agridirect.test';

export async function insertFarmerWithStore(testDb: TestDatabase) {
  const { db } = testDb;

  // The geography is already seeded; these inserts only fill gaps in a
  // partially-seeded test database.
  await db
    .insert(wilayas)
    .values({
      code: '19',
      nameAr: 'سطيف',
      nameFr: 'Sétif',
      nameEn: 'Setif',
      phoneCode: '036',
      sortOrder: 19,
    })
    .onConflictDoNothing();

  await db
    .insert(communes)
    .values({
      code: '1901',
      wilayaCode: '19',
      dairaCode: '1901',
      nameAr: 'سطيف',
      nameFr: 'Sétif',
      nameEn: 'Setif',
      postCode: '19000',
    })
    .onConflictDoNothing();

  const [farmer] = await db
    .insert(users)
    .values({
      email: FARMER_EMAIL,
      name: 'Ahmed Benali',
      phone: '+213555123456',
      primaryRole: 'farmer',
      emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
    })
    .returning();

  if (!farmer) throw new Error('farmer insert failed');

  await db.insert(farmerProfiles).values({
    userId: farmer.id,
    farmName: 'Ferme des Hauts Plateaux',
    verificationStatus: 'approved',
    verifiedAt: new Date('2026-01-02T00:00:00Z'),
  });

  const [store] = await db
    .insert(stores)
    .values({
      farmerId: farmer.id,
      slug: 'ferme-hauts-plateaux',
      name: 'Ferme des Hauts Plateaux',
      description: 'Légumes de saison cultivés à Sétif.',
      wilayaCode: '19',
      communeCode: '1901',
      addressLine: 'Route de Béjaïa, Sétif',
      phone: '+213555123456',
      status: 'active',
    })
    .returning();

  if (!store) throw new Error('store insert failed');

  const categoryRows = await db.select().from(categories);
  const bySlug = new Map(categoryRows.map((category) => [category.slug, category.id]));

  const categoryId = (slug: string) => {
    const id = bySlug.get(slug);
    if (!id) throw new Error(`category ${slug} is not seeded`);
    return id;
  };

  const [tomatoes] = await db
    .insert(products)
    .values({
      storeId: store.id,
      categoryId: categoryId('vegetables'),
      slug: 'tomates-grappe',
      name: 'Tomates grappe',
      description: 'Tomates fermes, cueillies le matin.',
      unit: 'kg',
      price: '120.00',
      status: 'published',
      publishedAt: new Date('2026-02-01T08:00:00Z'),
      minOrderQty: '1.000',
    })
    .returning();

  const [cereals] = await db
    .insert(products)
    .values({
      storeId: store.id,
      categoryId: categoryId('grains'),
      slug: 'ble-dur',
      name: 'Céréales — blé dur',
      description: 'Blé dur de la coopérative, récolte 2026.',
      unit: 'quintal',
      price: '4800.00',
      status: 'published',
      publishedAt: new Date('2026-02-02T08:00:00Z'),
      minOrderQty: '1.000',
    })
    .returning();

  const [draft] = await db
    .insert(products)
    .values({
      storeId: store.id,
      categoryId: categoryId('fruits'),
      slug: 'pommes-brouillon',
      name: 'Pommes (brouillon)',
      description: 'Pas encore modéré.',
      unit: 'kg',
      price: '90.00',
      status: 'draft',
    })
    .returning();

  if (!tomatoes || !cereals || !draft) throw new Error('product insert failed');

  await db.insert(inventoryItems).values([
    { productId: tomatoes.id, quantityAvailable: '250.000' },
    { productId: cereals.id, quantityAvailable: '40.000' },
  ]);

  await db.insert(productImages).values({
    productId: tomatoes.id,
    url: '/images/editorial/tomatoes.webp',
    altAr: 'طماطم',
    altFr: 'Tomates',
    altEn: 'Tomatoes',
    width: 1200,
    height: 800,
    sortOrder: 0,
  });

  return { farmer, store, tomatoes, cereals, draft, categoryId };
}
