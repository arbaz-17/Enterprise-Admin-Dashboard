
import { sql } from 'drizzle-orm'
import {
  pgSchema,
  uuid,
  text,
  boolean,
  timestamp,
  date,
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



export const departments = appPrivate.table(
  'departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').notNull(),

    description: text('description'),

    headEmployeeId: uuid('head_employee_id'),

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
  }
)

export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert



export type RefreshSession =
  typeof refreshSessions.$inferSelect


// Inferred TypeScript types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Matches the app_private.employees table created in Supabase SQL Editor.
export const employees = appPrivate.table('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  workEmail: text('work_email').notNull(),
  designation: text('designation').notNull(),
  departmentId: uuid('department_id').notNull()
    .references(() => departments.id, { onDelete: 'restrict' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['active', 'on_leave', 'inactive'] })
    .notNull().default('active'),
  joiningDate: date('joining_date', { mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert


export const clients = appPrivate.table('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert