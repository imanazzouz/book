import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '@/lib/id';
import { timestamps } from './columns';
import {
  adminRoleEnum,
  deliveryTypeEnum,
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  saleUnitEnum,
  sellerOrderStatusEnum,
} from './enums';
import { communes, wilayas } from './geo';
import { users } from './identity';
import { products } from './catalog';
import { stores } from './stores';

export const addresses = pgTable(
  'addresses',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar({ length: 60 }),
    contactName: varchar({ length: 120 }).notNull(),
    phone: varchar({ length: 16 }).notNull(),
    wilayaCode: varchar({ length: 2 })
      .notNull()
      .references(() => wilayas.code, { onDelete: 'restrict' }),
    communeCode: varchar({ length: 4 })
      .notNull()
      .references(() => communes.code, { onDelete: 'restrict' }),
    addressLine: text().notNull(),
    notes: text(),
    isDefault: boolean().notNull().default(false),
    ...timestamps,
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('addresses_user_idx').on(t.userId),
    check('addresses_phone_dz_format', sql`${t.phone} ~ '^\\+213[5-7][0-9]{8}$'`),
  ],
);

export const carts = pgTable(
  'carts',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    buyerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('carts_buyer_id_key').on(t.buyerId)],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: numeric({ precision: 10, scale: 3 }).notNull().default('1'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('cart_items_cart_product_key').on(t.cartId, t.productId),
    check('cart_items_quantity_positive', sql`${t.quantity} > 0`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orderNumber: varchar({ length: 24 }).notNull(),
    buyerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: orderStatusEnum().notNull().default('pending'),
    currency: varchar({ length: 3 }).notNull().default('DZD'),
    subtotal: numeric({ precision: 12, scale: 2 }).notNull(),
    shippingTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    discountTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    grandTotal: numeric({ precision: 12, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum().notNull().default('cod'),
    paymentStatus: paymentStatusEnum().notNull().default('unpaid'),
    contactName: varchar({ length: 120 }).notNull(),
    contactPhone: varchar({ length: 16 }).notNull(),
    wilayaCode: varchar({ length: 2 })
      .notNull()
      .references(() => wilayas.code, { onDelete: 'restrict' }),
    communeCode: varchar({ length: 4 })
      .notNull()
      .references(() => communes.code, { onDelete: 'restrict' }),
    addressLine: text().notNull(),
    deliveryNotes: text(),
    placedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp({ withTimezone: true }),
    cancelReason: text(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('orders_number_key').on(t.orderNumber),
    index('orders_buyer_placed_idx').on(t.buyerId, t.placedAt),
    index('orders_status_placed_idx').on(t.status, t.placedAt),
    index('orders_placed_idx').on(t.placedAt),
    check(
      'orders_amounts_non_negative',
      sql`${t.subtotal} >= 0 AND ${t.shippingTotal} >= 0 AND ${t.discountTotal} >= 0 AND ${t.grandTotal} >= 0`,
    ),
    check(
      'orders_total_consistent',
      sql`${t.grandTotal} = ${t.subtotal} + ${t.shippingTotal} - ${t.discountTotal}`,
    ),
    check(
      'orders_cancellation_reason',
      sql`${t.status} <> 'cancelled' OR length(btrim(coalesce(${t.cancelReason}, ''))) > 0`,
    ),
  ],
);

/** One row per store inside an order: each farmer owns exactly their sub-order. */
export const sellerOrders = pgTable(
  'seller_orders',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    farmerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sellerOrderNumber: varchar({ length: 28 }).notNull(),
    status: sellerOrderStatusEnum().notNull().default('pending'),
    subtotal: numeric({ precision: 12, scale: 2 }).notNull(),
    shippingCost: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    platformFee: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    feeRate: numeric({ precision: 5, scale: 4 }).notNull().default('0'),
    total: numeric({ precision: 12, scale: 2 }).notNull(),
    deliveryType: deliveryTypeEnum().notNull(),
    confirmationDeadline: timestamp({ withTimezone: true }),
    confirmedAt: timestamp({ withTimezone: true }),
    shippedAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    cancelReason: text(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('seller_orders_number_key').on(t.sellerOrderNumber),
    uniqueIndex('seller_orders_order_store_key').on(t.orderId, t.storeId),
    index('seller_orders_store_status_idx').on(t.storeId, t.status, t.createdAt),
    index('seller_orders_farmer_idx').on(t.farmerId, t.createdAt),
    check(
      'seller_orders_amounts_non_negative',
      sql`${t.subtotal} >= 0 AND ${t.shippingCost} >= 0 AND ${t.platformFee} >= 0 AND ${t.total} >= 0`,
    ),
    check('seller_orders_fee_rate_range', sql`${t.feeRate} >= 0 AND ${t.feeRate} <= 1`),
    check('seller_orders_total_consistent', sql`${t.total} = ${t.subtotal} + ${t.shippingCost}`),
    check(
      'seller_orders_cancellation_reason',
      sql`${t.status} NOT IN ('cancelled', 'rejected') OR length(btrim(coalesce(${t.cancelReason}, ''))) > 0`,
    ),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    sellerOrderId: uuid()
      .notNull()
      .references(() => sellerOrders.id, { onDelete: 'restrict' }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    productNameSnapshot: varchar({ length: 160 }).notNull(),
    unitSnapshot: saleUnitEnum().notNull(),
    unitPrice: numeric({ precision: 12, scale: 2 }).notNull(),
    quantity: numeric({ precision: 10, scale: 3 }).notNull(),
    lineTotal: numeric({ precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_items_seller_order_idx').on(t.sellerOrderId),
    index('order_items_product_idx').on(t.productId),
    check('order_items_quantity_positive', sql`${t.quantity} > 0`),
    check('order_items_price_positive', sql`${t.unitPrice} > 0`),
    check('order_items_line_total_non_negative', sql`${t.lineTotal} >= 0`),
  ],
);

export const orderStatusEvents = pgTable(
  'order_status_events',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    sellerOrderId: uuid().references(() => sellerOrders.id, { onDelete: 'cascade' }),
    fromStatus: text(),
    toStatus: text().notNull(),
    actorUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    actorRole: adminRoleEnum(),
    reason: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_status_events_order_idx').on(t.orderId, t.createdAt),
    index('order_status_events_seller_order_idx').on(t.sellerOrderId, t.createdAt),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    provider: varchar({ length: 40 }).notNull().default('cod'),
    method: paymentMethodEnum().notNull().default('cod'),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    currency: varchar({ length: 3 }).notNull().default('DZD'),
    status: paymentStatusEnum().notNull().default('unpaid'),
    reference: text(),
    collectedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('payments_order_idx').on(t.orderId),
    check('payments_amount_non_negative', sql`${t.amount} >= 0`),
  ],
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scope: varchar({ length: 40 }).notNull(),
    key: varchar({ length: 100 }).notNull(),
    requestHash: text().notNull(),
    resultRef: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.scope, t.key] }),
    index('idempotency_created_idx').on(t.createdAt),
  ],
);
