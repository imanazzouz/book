import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
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
import { disputeStatusEnum, reportStatusEnum, reportTargetEnum, reviewStatusEnum } from './enums';
import { products } from './catalog';
import { orders, orderItems, sellerOrders } from './commerce';
import { stores } from './stores';
import { users } from './identity';

/**
 * One review per purchased order line — the unique constraint is the structural
 * guarantee against fake or duplicated reviews.
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orderItemId: uuid()
      .notNull()
      .references(() => orderItems.id, { onDelete: 'restrict' }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    buyerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    rating: smallint().notNull(),
    comment: text(),
    status: reviewStatusEnum().notNull().default('published'),
    ...timestamps,
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('reviews_order_item_key').on(t.orderItemId),
    index('reviews_product_idx').on(t.productId, t.status, t.createdAt),
    index('reviews_store_idx').on(t.storeId, t.status),
    index('reviews_buyer_idx').on(t.buyerId),
    check('reviews_rating_range', sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

export const favorites = pgTable(
  'favorites',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const reports = pgTable(
  'reports',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    reporterId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    targetType: reportTargetEnum().notNull(),
    targetId: uuid().notNull(),
    reason: varchar({ length: 80 }).notNull(),
    description: text(),
    status: reportStatusEnum().notNull().default('open'),
    handledBy: uuid().references(() => users.id, { onDelete: 'set null' }),
    resolution: text(),
    ...timestamps,
  },
  (t) => [
    index('reports_status_idx').on(t.status, t.createdAt),
    index('reports_target_idx').on(t.targetType, t.targetId),
    check(
      'reports_resolution_required',
      sql`${t.status} NOT IN ('actioned', 'dismissed') OR length(btrim(coalesce(${t.resolution}, ''))) > 0`,
    ),
  ],
);

export const disputes = pgTable(
  'disputes',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    sellerOrderId: uuid().references(() => sellerOrders.id, { onDelete: 'restrict' }),
    openedBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    againstUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    reason: varchar({ length: 80 }).notNull(),
    description: text().notNull(),
    status: disputeStatusEnum().notNull().default('open'),
    resolutionNote: text(),
    resolvedBy: uuid().references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('disputes_status_idx').on(t.status, t.createdAt),
    index('disputes_order_idx').on(t.orderId),
    check(
      'disputes_resolution_required',
      sql`${t.status} NOT IN ('resolved_buyer', 'resolved_farmer', 'resolved_split', 'closed')
          OR length(btrim(coalesce(${t.resolutionNote}, ''))) > 0`,
    ),
  ],
);

export const disputeMessages = pgTable(
  'dispute_messages',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    disputeId: uuid()
      .notNull()
      .references(() => disputes.id, { onDelete: 'cascade' }),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text().notNull(),
    attachmentUrl: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('dispute_messages_dispute_idx').on(t.disputeId, t.createdAt),
    check('dispute_messages_body_not_blank', sql`length(btrim(${t.body})) > 0`),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar({ length: 60 }).notNull(),
    params: jsonb().$type<Record<string, string | number>>().notNull().default({}),
    link: text(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notifications_user_unread_idx').on(t.userId, t.readAt, t.createdAt),
    index('notifications_created_idx').on(t.createdAt),
  ],
);

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar({ length: 60 }).notNull(),
    inApp: boolean().notNull().default(true),
    email: boolean().notNull().default(true),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.type] })],
);
