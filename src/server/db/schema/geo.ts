import { boolean, index, numeric, pgTable, smallint, varchar } from 'drizzle-orm/pg-core';

/**
 * Reference geography. Uses official numeric codes as natural keys so the
 * division published in the Journal Officiel maps 1:1 (leading zeros kept).
 * Counts are data, never constants: adding wilayas/communes needs no code change.
 */
export const wilayas = pgTable(
  'wilayas',
  {
    code: varchar({ length: 2 }).primaryKey(),
    nameAr: varchar({ length: 120 }).notNull(),
    nameFr: varchar({ length: 120 }).notNull(),
    nameEn: varchar({ length: 120 }).notNull(),
    phoneCode: varchar({ length: 6 }),
    isNewWilaya: boolean().notNull().default(false),
    sortOrder: smallint().notNull().default(0),
  },
  (t) => [index('wilayas_sort_idx').on(t.sortOrder)],
);

export const communes = pgTable(
  'communes',
  {
    code: varchar({ length: 4 }).primaryKey(),
    wilayaCode: varchar({ length: 2 })
      .notNull()
      .references(() => wilayas.code, { onDelete: 'restrict' }),
    // Nullable on purpose: the official source has no daira assignment for the
    // 57 communes of Algiers (wilaya 16). We store the gap instead of inventing codes.
    dairaCode: varchar({ length: 4 }),
    nameAr: varchar({ length: 160 }).notNull(),
    nameFr: varchar({ length: 160 }).notNull(),
    nameEn: varchar({ length: 160 }).notNull(),
    postCode: varchar({ length: 5 }),
    latitude: numeric({ precision: 9, scale: 6 }),
    longitude: numeric({ precision: 9, scale: 6 }),
    isActive: boolean().notNull().default(true),
  },
  (t) => [
    index('communes_wilaya_idx').on(t.wilayaCode),
    index('communes_daira_idx').on(t.dairaCode),
  ],
);

export type WilayaRow = typeof wilayas.$inferSelect;
export type CommuneRow = typeof communes.$inferSelect;
