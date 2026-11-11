/**
 * Idempotent platform seed.
 *
 *   npm run db:seed
 *
 * Seeds *reference* data only: geography (69 wilayas / 1 541 communes),
 * categories, roles, permissions, delivery methods and platform settings.
 * It never creates users, stores, products, orders or reviews — the marketplace
 * stays genuinely empty until real farmers sign up.
 *
 * Every statement is an upsert, so running it twice is safe and updates names
 * when the source data changes.
 */
import { sql } from 'drizzle-orm';
import type { AnyDatabase } from '../types';
import { closeDb, getDb, isDatabaseConfigured } from '../client';
import {
  categories,
  communes,
  deliveryMethods,
  permissions,
  platformSettings,
  rolePermissions,
  roles,
  wilayas,
} from '../schema';
import {
  OFFICIAL_COMMUNE_COUNT,
  OFFICIAL_WILAYA_COUNT,
  buildCommuneRows,
  buildWilayaRows,
} from './geography';
import {
  CATEGORY_ROWS,
  DELIVERY_METHOD_SEED,
  PERMISSION_SEED,
  PLATFORM_SETTING_SEED,
  ROLE_PERMISSION_SEED,
  ROLE_SEED,
} from './reference';

const CHUNK_SIZE = 500;

function chunk<T>(items: readonly T[], size = CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function seedGeography(db: AnyDatabase): Promise<void> {
  const wilayaRows = buildWilayaRows();
  const communeRows = buildCommuneRows();

  if (wilayaRows.length !== OFFICIAL_WILAYA_COUNT) {
    throw new Error(
      `expected ${OFFICIAL_WILAYA_COUNT} wilayas, source returned ${wilayaRows.length}`,
    );
  }
  if (communeRows.length !== OFFICIAL_COMMUNE_COUNT) {
    throw new Error(
      `expected ${OFFICIAL_COMMUNE_COUNT} communes, source returned ${communeRows.length}`,
    );
  }

  await db
    .insert(wilayas)
    .values(wilayaRows)
    .onConflictDoUpdate({
      target: wilayas.code,
      set: {
        nameAr: sql`excluded.name_ar`,
        nameFr: sql`excluded.name_fr`,
        nameEn: sql`excluded.name_en`,
        phoneCode: sql`excluded.phone_code`,
        isNewWilaya: sql`excluded.is_new_wilaya`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  for (const batch of chunk(communeRows)) {
    await db
      .insert(communes)
      .values(batch)
      .onConflictDoUpdate({
        target: communes.code,
        set: {
          wilayaCode: sql`excluded.wilaya_code`,
          dairaCode: sql`excluded.daira_code`,
          nameAr: sql`excluded.name_ar`,
          nameFr: sql`excluded.name_fr`,
          nameEn: sql`excluded.name_en`,
          postCode: sql`excluded.post_code`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
        },
      });
  }

  console.log(`  geography: ${wilayaRows.length} wilayas, ${communeRows.length} communes`);
}

async function seedCategories(db: AnyDatabase): Promise<void> {
  await db
    .insert(categories)
    .values(CATEGORY_ROWS)
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        nameAr: sql`excluded.name_ar`,
        nameFr: sql`excluded.name_fr`,
        nameEn: sql`excluded.name_en`,
        sortOrder: sql`excluded.sort_order`,
      },
    });
  console.log(`  categories: ${CATEGORY_ROWS.length}`);
}

async function seedRolesAndPermissions(db: AnyDatabase): Promise<void> {
  await db
    .insert(roles)
    .values(
      ROLE_SEED.map((role) => ({
        code: role.code,
        nameAr: role.nameAr,
        nameFr: role.nameFr,
        nameEn: role.nameEn,
      })),
    )
    .onConflictDoUpdate({
      target: roles.code,
      set: {
        nameAr: sql`excluded.name_ar`,
        nameFr: sql`excluded.name_fr`,
        nameEn: sql`excluded.name_en`,
      },
    });

  await db
    .insert(permissions)
    .values(
      PERMISSION_SEED.map(([code, descriptionAr, descriptionFr, descriptionEn, isCritical]) => ({
        code,
        descriptionAr,
        descriptionFr,
        descriptionEn,
        isCritical,
      })),
    )
    .onConflictDoUpdate({
      target: permissions.code,
      set: {
        descriptionAr: sql`excluded.description_ar`,
        descriptionFr: sql`excluded.description_fr`,
        descriptionEn: sql`excluded.description_en`,
        isCritical: sql`excluded.is_critical`,
      },
    });

  const grants = Object.entries(ROLE_PERMISSION_SEED).flatMap(([roleCode, permissionCodes]) =>
    permissionCodes.map((permissionCode) => ({
      roleCode: roleCode as (typeof ROLE_SEED)[number]['code'],
      permissionCode,
    })),
  );

  // Grants are declarative: drop what is no longer listed, then upsert.
  await db.delete(rolePermissions);
  if (grants.length > 0) {
    await db.insert(rolePermissions).values(grants).onConflictDoNothing();
  }
  console.log(
    `  roles: ${ROLE_SEED.length}, permissions: ${PERMISSION_SEED.length}, grants: ${grants.length}`,
  );
}

async function seedDeliveryMethods(db: AnyDatabase): Promise<void> {
  await db
    .insert(deliveryMethods)
    .values(DELIVERY_METHOD_SEED)
    .onConflictDoUpdate({
      target: deliveryMethods.code,
      set: {
        type: sql`excluded.type`,
        nameAr: sql`excluded.name_ar`,
        nameFr: sql`excluded.name_fr`,
        nameEn: sql`excluded.name_en`,
        requiresCarrier: sql`excluded.requires_carrier`,
        sortOrder: sql`excluded.sort_order`,
      },
    });
  console.log(`  delivery methods: ${DELIVERY_METHOD_SEED.length}`);
}

async function seedPlatformSettings(db: AnyDatabase): Promise<void> {
  await db
    .insert(platformSettings)
    .values(
      PLATFORM_SETTING_SEED.map((setting) => ({
        key: setting.key,
        value: setting.value,
        isCritical: setting.isCritical,
        description: setting.description,
      })),
    )
    // Settings are operator-editable: never overwrite a value that already exists.
    .onConflictDoNothing();
  console.log(`  platform settings: ${PLATFORM_SETTING_SEED.length}`);
}

export async function seedDatabase(db: AnyDatabase): Promise<void> {
  await seedGeography(db);
  await seedCategories(db);
  await seedRolesAndPermissions(db);
  await seedDeliveryMethods(db);
  await seedPlatformSettings(db);
}

async function main(): Promise<void> {
  if (!isDatabaseConfigured()) {
    console.error(
      'DATABASE_URL is missing. Create .env.local (see .env.example) with the Neon connection string, then retry.',
    );
    process.exitCode = 1;
    return;
  }

  const db = getDb();
  console.log('Seeding reference data (no business data)\n');
  try {
    await seedDatabase(db);
    console.log('\nSeed complete.');
  } finally {
    await closeDb();
  }
}

const invokedDirectly = process.argv[1]?.includes('seed');

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
