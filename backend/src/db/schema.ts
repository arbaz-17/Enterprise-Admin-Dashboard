
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  pgSchema,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  check,
  index,
  uniqueIndex,
  unique,
  integer,
} from "drizzle-orm/pg-core";

export const appPrivate = pgSchema("app_private");

// --------------------------------------------------
// Users
// --------------------------------------------------

export const users = appPrivate.table(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email")
      .notNull()
      .unique("users_email_key"),
    passwordHash: text("password_hash").notNull(),

    role: text("role", {
      enum: ["admin", "manager", "viewer"],
    })
      .notNull()
      .default("viewer"),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "users_role_check",
      sql`${table.role} IN ('admin', 'manager', 'viewer')`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// --------------------------------------------------
// Refresh Sessions
// --------------------------------------------------

export const refreshSessions = appPrivate.table(
  "refresh_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    familyId: uuid("family_id").notNull(),

    tokenHash: text("token_hash")
      .notNull()
      .unique("refresh_sessions_token_hash_key"),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    usedAt: timestamp("used_at", {
      withTimezone: true,
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    index("refresh_sessions_user_id_idx")
      .on(table.userId),

    index("refresh_sessions_family_id_idx")
      .on(table.familyId),
  ],
);

export type RefreshSession =
  typeof refreshSessions.$inferSelect;

// --------------------------------------------------
// Departments
// --------------------------------------------------

export const departments = appPrivate.table(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),

    // Circular reference: employees.departmentId
    // also references departments.id.
    headEmployeeId: uuid("head_employee_id")
      .references(
        (): AnyPgColumn => employees.id,
        { onDelete: "set null" },
      ),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("departments_name_unique_ci_idx")
      .on(sql`lower(btrim(${table.name}))`),

    index("departments_head_employee_id_idx")
      .on(table.headEmployeeId),

    check(
      "departments_name_not_blank",
      sql`length(btrim(${table.name})) > 0`,
    ),
  ],
);

export type Department =
  typeof departments.$inferSelect;

export type NewDepartment =
  typeof departments.$inferInsert;

// --------------------------------------------------
// Employees
// --------------------------------------------------

export const employees = appPrivate.table(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fullName: text("full_name").notNull(),
    workEmail: text("work_email").notNull(),
    designation: text("designation").notNull(),

    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, {
        onDelete: "restrict",
      }),

    userId: uuid("user_id")
      .unique("employees_user_id_key")
      .references(() => users.id, {
        onDelete: "set null",
      }),

    status: text("status", {
      enum: ["active", "on_leave", "inactive"],
    })
      .notNull()
      .default("active"),

    joiningDate: date("joining_date", {
      mode: "string",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("employees_work_email_unique_ci_idx")
      .on(sql`lower(btrim(${table.workEmail}))`),

    index("employees_department_id_idx")
      .on(table.departmentId),

    check(
      "employees_full_name_not_blank",
      sql`length(btrim(${table.fullName})) > 0`,
    ),

    check(
      "employees_work_email_not_blank",
      sql`length(btrim(${table.workEmail})) > 0`,
    ),

    check(
      "employees_designation_not_blank",
      sql`length(btrim(${table.designation})) > 0`,
    ),

    check(
      "employees_status_check",
      sql`${table.status} IN ('active', 'on_leave', 'inactive')`,
    ),
  ],
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

// --------------------------------------------------
// Clients
// --------------------------------------------------

export const clients = appPrivate.table(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),

    status: text("status", {
      enum: ["active", "inactive"],
    })
      .notNull()
      .default("active"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    index("clients_status_idx").on(table.status),

    check(
      "clients_name_not_blank",
      sql`length(btrim(${table.name})) > 0`,
    ),

    check(
      "clients_contact_email_not_blank",
      sql`${table.contactEmail} IS NULL OR
          length(btrim(${table.contactEmail})) > 0`,
    ),

    check(
      "clients_status_check",
      sql`${table.status} IN ('active', 'inactive')`,
    ),
  ],
);

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

// --------------------------------------------------
// Projects
// --------------------------------------------------

export const projects = appPrivate.table(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, {
        onDelete: "restrict",
      }),

    managerEmployeeId: uuid("manager_employee_id")
      .references(() => employees.id, {
        onDelete: "restrict",
      }),

    status: text("status", {
      enum: [
        "planning",
        "active",
        "on_hold",
        "completed",
      ],
    })
      .notNull()
      .default("planning"),

    priority: text("priority", {
      enum: ["low", "medium", "high"],
    })
      .notNull()
      .default("medium"),

    progress: integer("progress")
      .notNull()
      .default(0),

    startDate: date("start_date", {
      mode: "string",
    }),

    dueDate: date("due_date", {
      mode: "string",
    }),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    index("projects_client_id_idx")
      .on(table.clientId),

    index("projects_manager_employee_id_idx")
      .on(table.managerEmployeeId),

    index("projects_status_idx")
      .on(table.status),

    check(
      "projects_name_not_blank",
      sql`length(btrim(${table.name})) > 0`,
    ),

    check(
      "projects_date_order_check",
      sql`${table.startDate} IS NULL OR
          ${table.dueDate} IS NULL OR
          ${table.dueDate} >= ${table.startDate}`,
    ),

    check(
      "projects_priority_check",
      sql`${table.priority} IN ('low', 'medium', 'high')`,
    ),

    check(
      "projects_progress_check",
      sql`${table.progress} >= 0 AND
          ${table.progress} <= 100`,
    ),

    check(
      "projects_status_check",
      sql`${table.status} IN (
          'planning', 'active', 'on_hold', 'completed'
      )`,
    ),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// --------------------------------------------------
// Project Assignments
// --------------------------------------------------

export const projectAssignments = appPrivate.table(
  "project_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "restrict",
      }),

    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, {
        onDelete: "restrict",
      }),

    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    unique("project_assignments_project_employee_unique")
      .on(table.projectId, table.employeeId),

    index("project_assignments_employee_id_idx")
      .on(table.employeeId),
  ],
);

export type ProjectAssignment =
  typeof projectAssignments.$inferSelect;

export type NewProjectAssignment =
  typeof projectAssignments.$inferInsert;
