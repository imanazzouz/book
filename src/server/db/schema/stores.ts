import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '@/lib/id';
import { timestamps } from './columns';
import { storeStatusEnum, verificationStatusEnum } from './enums';
import { communes, wilayas } from './geo';
import { users } from './identity';
import { deliveryMethods } from './delivery';

/** Farmer-specific data. One row per farmer account; the store is separate. */
export const farmerProfiles = pgTable(
  'farmer_profiles',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    farmName: varchar({ length: 160 }).notNull(),
    farmSizeHa: numeric({ precision: 10, scale: 2 }),
    productionTypes: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    verificationStatus: verificationStatusEnum().notNull().default('unsubmitted'),
    verifiedAt: timestamp({ withTimezone: true }),
    verifiedBy: uuid().references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('farmer_profiles_user_id_key').on(t.userId),
    index('farmer_profiles_status_idx').on(t.verificationStatus),
    check('farmer_profiles_farm_name_not_blank', sql`length(btrim(${t.farmName})) > 0`),
  ],
);

export const stores = pgTable(
  'stores',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    farmerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    slug: varchar({ length: 80 }).notNull(),
    name: varchar({ length: 160 }).notNull(),
    description: text().notNull(),
    logoUrl: text(),
    coverUrl: text(),
    wilayaCode: varchar({ length: 2 })
      .notNull()
      .references(() => wilayas.code, { onDelete: 'restrict' }),
    communeCode: varchar({ length: 4 })
      .notNull()
      .references(() => communes.code, { onDelete: 'restrict' }),
    addressLine: text().notNull(),
    phone: varchar({ length: 16 }).notNull(),
    status: storeStatusEnum().notNull().default('draft'),
    minOrderTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    isPickupEnabled: boolean().notNull().default(true),
    pickupInstructions: text(),
    deliveryNotes: text(),
    suspendedReason: text(),
    suspendedAt: timestamp({ withTimezone: true }),
    ...timestamps,
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('stores_slug_key').on(t.slug),
    uniqueIndex('stores_farmer_id_key').on(t.farmerId),
    index('stores_status_wilaya_idx').on(t.status, t.wilayaCode),
    index('stores_wilaya_idx').on(t.wilayaCode),
    check('stores_min_order_non_negative', sql`${t.minOrderTotal} >= 0`),
    check('stores_name_not_blank', sql`length(btrim(${t.name})) > 0`),
    check('stores_slug_format', sql`${t.slug} ~ '^[a-z0-9-]{3,80}$'`),
    check('stores_phone_dz_format', sql`${t.phone} ~ '^\\+213[5-7][0-9]{8}$'`),
  ],
);

export const storeVerificationRequests = pgTable(
  'store_verification_requests',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    submittedBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: verificationStatusEnum().notNull().default('pending'),
    reviewerId: uuid().references(() => users.id, { onDelete: 'set null' }),
    reviewerNote: text(),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('store_verifications_store_idx').on(t.storeId, t.submittedAt),
    index('store_verifications_status_idx').on(t.status),
    check(
      'store_verifications_rejection_reason',
      sql`${t.status} <> 'rejected' OR length(btrim(coalesce(${t.reviewerNote}, ''))) > 0`,
    ),
  ],
);

export const storeDocuments = pgTable(
  'store_documents',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    requestId: uuid()
      .notNull()
      .references(() => storeVerificationRequests.id, { onDelete: 'cascade' }),
    docType: varchar({ length: 40 }).notNull(),
    fileUrl: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('store_documents_request_idx').on(t.requestId)],
);

/** Farmer-level delivery coverage and fee overrides (never a global assumption). */
export const storeDeliveryZones = pgTable(
  'store_delivery_zones',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    methodCode: text()
      .notNull()
      .references(() => deliveryMethods.code, { onDelete: 'restrict' }),
    wilayaCode: varchar({ length: 2 })
      .notNull()
      .references(() => wilayas.code, { onDelete: 'restrict' }),
    communeCode: varchar({ length: 4 }).references(() => communes.code, {
      onDelete: 'restrict',
    }),
    feeOverride: numeric({ precision: 10, scale: 2 }),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_zones_unique_wilaya')
      .on(t.storeId, t.methodCode, t.wilayaCode)
      .where(sql`${t.communeCode} IS NULL`),
    uniqueIndex('store_zones_unique_commune')
      .on(t.storeId, t.methodCode, t.wilayaCode, t.communeCode)
      .where(sql`${t.communeCode} IS NOT NULL`),
    check('store_zones_fee_non_negative', sql`${t.feeOverride} IS NULL OR ${t.feeOverride} >= 0`),
  ],
);

export type StoreRow = typeof stores.$inferSelect;
export type FarmerProfileRow = typeof farmerProfiles.$inferSelect;
