
import { sql } from 'drizzle-orm'
import {
  pgSchema,
  uuid,
  text,
  boolean,
  timestamp,
  check,
  index,
} from 'drizzle-orm/pg-core'

export const appPrivate = pgSchema('app_private')

export const users = appPrivate.table(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').notNull(),

    email: text('email').notNull().unique(),

    passwordHash: text('password_hash').notNull(),

    role: text('role', {
      enum: ['admin', 'manager', 'viewer'],
    })
      .notNull()
      .default('viewer'),

    isActive: boolean('is_active')
      .notNull()
      .default(true),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'users_role_check',
      sql`${table.role} IN ('admin', 'manager', 'viewer')`
    ),

    
  ]
)


export const refreshSessions = appPrivate.table(
  'refresh_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    familyId: uuid('family_id').notNull(),

    tokenHash: text('token_hash').notNull().unique(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    usedAt: timestamp('used_at', {
      withTimezone: true,
    }),

    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('refresh_sessions_user_id_idx').on(table.userId),
    index('refresh_sessions_family_id_idx').on(table.familyId),
  ]
)

export type RefreshSession =
  typeof refreshSessions.$inferSelect


// Inferred TypeScript types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
