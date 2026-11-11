import { sql } from 'drizzle-orm';
import {
  type PgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '@/lib/id';
import { timestamps } from './columns';
import { inventoryReasonEnum, productStatusEnum, saleUnitEnum } from './enums';
import { stores } from './stores';
import { users } from './identity';

export const categories = pgTable(
  'categories',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    parentId: uuid().references((): PgColumn => categories.id, { onDelete: 'restrict' }),
    slug: varchar({ length: 60 }).notNull(),
    nameAr: varchar({ length: 120 }).notNull(),
    nameFr: varchar({ length: 120 }).notNull(),
    nameEn: varchar({ length: 120 }).notNull(),
    sortOrder: smallint().notNull().default(0),
    imageUrl: text(),
    isActive: boolean().notNull().default(true),
    ...timestamps,
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('categories_slug_key').on(t.slug),
    index('categories_parent_idx').on(t.parentId),
    index('categories_active_sort_idx').on(t.isActive, t.sortOrder),
    check('categories_slug_format', sql`${t.slug} ~ '^[a-z0-9-]{2,60}$'`),
  ],
);

export const products = pgTable(
  'products',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    slug: varchar({ length: 90 }).notNull(),
    name: varchar({ length: 160 }).notNull(),
    description: text().notNull(),
    unit: saleUnitEnum().notNull(),
    price: numeric({ precision: 12, scale: 2 }).notNull(),
    compareAtPrice: numeric({ precision: 12, scale: 2 }),
    minOrderQty: numeric({ precision: 10, scale: 3 }).notNull().default('1'),
    status: productStatusEnum().notNull().default('draft'),
    isOrganic: boolean().notNull().default(false),
    supportsDelivery: boolean().notNull().default(true),
    supportsPickup: boolean().notNull().default(true),
    harvestDate: date(),
    seasonStartMonth: smallint(),
    seasonEndMonth: smallint(),
    rejectionReason: text(),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('products_store_slug_key').on(t.storeId, t.slug),
    index('products_status_published_idx').on(t.status, t.publishedAt),
    index('products_store_status_idx').on(t.storeId, t.status),
    index('products_category_status_idx').on(t.categoryId, t.status),
    index('products_price_idx').on(t.price),
    check('products_price_positive', sql`${t.price} > 0`),
    check(
      'products_compare_at_not_cheaper',
      sql`${t.compareAtPrice} IS NULL OR ${t.compareAtPrice} >= ${t.price}`,
    ),
    check('products_min_order_positive', sql`${t.minOrderQty} > 0`),
    check('products_fulfillment_available', sql`${t.supportsDelivery} OR ${t.supportsPickup}`),
    check(
      'products_season_months_valid',
      sql`(${t.seasonStartMonth} IS NULL OR ${t.seasonStartMonth} BETWEEN 1 AND 12)
          AND (${t.seasonEndMonth} IS NULL OR ${t.seasonEndMonth} BETWEEN 1 AND 12)`,
    ),
    check(
      'products_rejection_reason_required',
      sql`${t.status} <> 'rejected' OR length(btrim(coalesce(${t.rejectionReason}, ''))) > 0`,
    ),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text().notNull(),
    altAr: varchar({ length: 200 }).notNull(),
    altFr: varchar({ length: 200 }).notNull(),
    altEn: varchar({ length: 200 }).notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    sortOrder: smallint().notNull().default(0),
    mediaId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_images_product_sort_key').on(t.productId, t.sortOrder),
    index('product_images_product_idx').on(t.productId),
    check('product_images_dimensions_positive', sql`${t.width} > 0 AND ${t.height} > 0`),
  ],
);

/** Secondary tags; a product's primary classification stays products.category_id. */
export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

/** Stock lives apart from presentation data so availability can change alone. */
export const inventoryItems = pgTable(
  'inventory_items',
  {
    productId: uuid()
      .primaryKey()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantityAvailable: numeric({ precision: 10, scale: 3 }).notNull().default('0'),
    lowStockThreshold: numeric({ precision: 10, scale: 3 }).notNull().default('0'),
    version: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // Final safety net against overselling, independent of application logic.
    check('inventory_quantity_non_negative', sql`${t.quantityAvailable} >= 0`),
    check('inventory_threshold_non_negative', sql`${t.lowStockThreshold} >= 0`),
    index('inventory_available_idx')
      .on(t.quantityAvailable)
      .where(sql`${t.quantityAvailable} > 0`),
  ],
);

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    delta: numeric({ precision: 10, scale: 3 }).notNull(),
    reason: inventoryReasonEnum().notNull(),
    refType: varchar({ length: 40 }),
    refId: uuid(),
    note: text(),
    createdBy: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('inventory_movements_product_idx').on(t.productId, t.createdAt),
    check('inventory_movements_delta_non_zero', sql`${t.delta} <> 0`),
  ],
);

export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type InventoryItemRow = typeof inventoryItems.$inferSelect;
