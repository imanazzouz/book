import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '@/lib/id';
import { mediaPurposeEnum, mediaStatusEnum } from './enums';
import { users } from './identity';

/** Uploaded files. Storage keys are random; nothing is user-named. */
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    ownerUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    storeId: uuid(),
    productId: uuid(),
    storageKey: text().notNull(),
    url: text().notNull(),
    mimeType: varchar({ length: 60 }).notNull(),
    bytes: integer().notNull(),
    width: integer(),
    height: integer(),
    checksumSha256: varchar({ length: 64 }),
    purpose: mediaPurposeEnum().notNull(),
    status: mediaStatusEnum().notNull().default('pending'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('media_owner_idx').on(t.ownerUserId, t.createdAt),
    index('media_store_idx').on(t.storeId),
    index('media_product_idx').on(t.productId),
    check('media_bytes_positive', sql`${t.bytes} > 0`),
    check(
      'media_mime_allowed',
      sql`${t.mimeType} IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')`,
    ),
  ],
);

/** Key/value platform configuration. `is_critical` requires super_admin + reason. */
export const platformSettings = pgTable('platform_settings', {
  key: varchar({ length: 80 }).primaryKey(),
  value: jsonb().$type<unknown>().notNull(),
  isCritical: boolean().notNull().default(false),
  description: text(),
  updatedBy: uuid().references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
