import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '@/lib/id';
import { deliveryTypeEnum } from './enums';
import { wilayas } from './geo';

export const deliveryMethods = pgTable(
  'delivery_methods',
  {
    code: varchar({ length: 40 }).primaryKey(),
    type: deliveryTypeEnum().notNull(),
    nameAr: varchar({ length: 120 }).notNull(),
    nameFr: varchar({ length: 120 }).notNull(),
    nameEn: varchar({ length: 120 }).notNull(),
    requiresCarrier: boolean().notNull().default(false),
    isActive: boolean().notNull().default(true),
    sortOrder: smallint().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('delivery_methods_active_idx').on(t.isActive, t.sortOrder)],
);

/**
 * Platform-wide shipping prices per destination wilaya. A farmer can override
 * them through store_delivery_zones; when neither exists the destination is
 * simply not served (we never invent a price).
 */
export const shippingRates = pgTable(
  'shipping_rates',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    methodCode: varchar({ length: 40 })
      .notNull()
      .references(() => deliveryMethods.code, { onDelete: 'cascade' }),
    fromWilayaCode: varchar({ length: 2 }).references(() => wilayas.code, {
      onDelete: 'restrict',
    }),
    toWilayaCode: varchar({ length: 2 })
      .notNull()
      .references(() => wilayas.code, { onDelete: 'restrict' }),
    baseFee: numeric({ precision: 10, scale: 2 }).notNull(),
    perKgFee: numeric({ precision: 10, scale: 2 }).notNull().default('0'),
    freeOver: numeric({ precision: 12, scale: 2 }),
    minDays: smallint(),
    maxDays: smallint(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('shipping_rates_unique_national')
      .on(t.methodCode, t.toWilayaCode)
      .where(sql`${t.fromWilayaCode} IS NULL`),
    uniqueIndex('shipping_rates_unique_route')
      .on(t.methodCode, t.fromWilayaCode, t.toWilayaCode)
      .where(sql`${t.fromWilayaCode} IS NOT NULL`),
    index('shipping_rates_destination_idx').on(t.toWilayaCode, t.isActive),
    check('shipping_rates_base_non_negative', sql`${t.baseFee} >= 0`),
    check('shipping_rates_per_kg_non_negative', sql`${t.perKgFee} >= 0`),
    check(
      'shipping_rates_days_valid',
      sql`(${t.minDays} IS NULL OR ${t.minDays} >= 0)
          AND (${t.maxDays} IS NULL OR ${t.minDays} IS NULL OR ${t.maxDays} >= ${t.minDays})`,
    ),
  ],
);
