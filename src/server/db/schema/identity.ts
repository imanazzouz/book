import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '@/lib/id';
import { timestamps } from './columns';
import { adminRoleEnum, localeEnum, otpPurposeEnum, userStatusEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: text().notNull(),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    name: text().notNull(),
    phone: text(),
    status: userStatusEnum().notNull().default('active'),
    defaultLocale: localeEnum().notNull().default('ar'),
    /** Fast routing hint only. Authorization always reads user_roles. */
    primaryRole: adminRoleEnum().notNull().default('buyer'),
    lastLoginAt: timestamp({ withTimezone: true }),
    ...timestamps,
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    uniqueIndex('users_phone_key').on(t.phone),
    index('users_status_role_idx').on(t.status, t.primaryRole),
    index('users_created_at_idx').on(t.createdAt),
    check('users_email_lowercase', sql`${t.email} = lower(${t.email})`),
    check('users_phone_dz_format', sql`${t.phone} IS NULL OR ${t.phone} ~ '^\\+213[5-7][0-9]{8}$'`),
    check('users_name_not_blank', sql`length(btrim(${t.name})) > 0`),
  ],
);

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    avatarUrl: text(),
    preferredWilayaCode: text(),
    notificationDefaults: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex('user_profiles_user_id_key').on(t.userId)],
);

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    emailAtProvider: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('oauth_accounts_provider_account_key').on(t.provider, t.providerAccountId),
    index('oauth_accounts_user_idx').on(t.userId),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text().notNull(),
    ipHash: text(),
    userAgent: text(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    lastUsedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp({ withTimezone: true }),
    rotatedFromId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('sessions_token_hash_key').on(t.tokenHash),
    index('sessions_user_active_idx').on(t.userId, t.revokedAt, t.expiresAt),
  ],
);

export const authOtpCodes = pgTable(
  'auth_otp_codes',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: text().notNull(),
    purpose: otpPurposeEnum().notNull(),
    codeHash: text().notNull(),
    attempts: smallint().notNull().default(0),
    maxAttempts: smallint().notNull().default(5),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    consumedAt: timestamp({ withTimezone: true }),
    ipHash: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('otp_codes_email_purpose_idx').on(t.email, t.purpose, t.createdAt),
    check('otp_codes_attempts_non_negative', sql`${t.attempts} >= 0`),
    check('otp_codes_max_attempts_positive', sql`${t.maxAttempts} > 0`),
  ],
);

export const roles = pgTable('roles', {
  code: adminRoleEnum().primaryKey(),
  nameAr: text().notNull(),
  nameFr: text().notNull(),
  nameEn: text().notNull(),
  isSystem: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  code: text().primaryKey(),
  descriptionAr: text().notNull(),
  descriptionFr: text().notNull(),
  descriptionEn: text().notNull(),
  isCritical: boolean().notNull().default(false),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleCode: adminRoleEnum()
      .notNull()
      .references(() => roles.code, { onDelete: 'cascade' }),
    permissionCode: text()
      .notNull()
      .references(() => permissions.code, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleCode, t.permissionCode] })],
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleCode: adminRoleEnum()
      .notNull()
      .references(() => roles.code, { onDelete: 'restrict' }),
    grantedBy: uuid().references(() => users.id, { onDelete: 'set null' }),
    grantedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleCode] }),
    index('user_roles_role_idx').on(t.roleCode),
  ],
);

/** Append-only audit trail. UPDATE/DELETE are revoked in a raw SQL migration. */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    actorUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    actorRole: adminRoleEnum(),
    action: text().notNull(),
    resourceType: text().notNull(),
    resourceId: text(),
    result: text().notNull(),
    reason: text(),
    ipHash: text(),
    userAgentHash: text(),
    metadata: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_resource_idx').on(t.resourceType, t.resourceId, t.createdAt),
    index('audit_logs_actor_idx').on(t.actorUserId, t.createdAt),
    index('audit_logs_action_idx').on(t.action, t.createdAt),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type RoleCode = UserRow['primaryRole'];
export type SessionRow = typeof sessions.$inferSelect;
export type AuditLogRow = typeof auditLogs.$inferSelect;
