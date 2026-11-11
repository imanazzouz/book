import { timestamp } from 'drizzle-orm/pg-core';

/** Shared audit columns: every mutable business row records when it changed. */
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
