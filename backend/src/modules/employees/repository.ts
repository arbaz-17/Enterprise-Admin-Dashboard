
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "../../db/index.js";
import {
  departments,
  employees,
  users,
} from "../../db/schema.js";

import type {
  EmployeeListQuery,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "./schemas.js";

// Shared projection for employee list and detail queries.
const employeeProjection = {
  id: employees.id,
  fullName: employees.fullName,
  workEmail: employees.workEmail,
  designation: employees.designation,
  status: employees.status,
  departmentId: employees.departmentId,
  departmentName: departments.name,
  userId: employees.userId,
  linkedUserName: users.name,
  joiningDate: employees.joiningDate,
  createdAt: employees.createdAt,
  updatedAt: employees.updatedAt,
};

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * Get a paginated, filtered and sorted list of employees.
 */
export async function listEmployees(query: EmployeeListQuery) {
  const {
    page,
    pageSize,
    q,
    status,
    departmentId,
    sortBy,
    sortDir,
  } = query;

  const sortColumns = {
    fullName: employees.fullName,
    designation: employees.designation,
    departmentName: departments.name,
    status: employees.status,
    joiningDate: employees.joiningDate,
    linkedUserName: users.name,
  };

  const sortColumn = sortColumns[sortBy];

  const filters: SQL[] = [];

  if (q) {
    const match = or(
      ilike(employees.fullName, `%${q}%`),
      ilike(employees.workEmail, `%${q}%`),
      ilike(employees.designation, `%${q}%`),
    );

    if (match) filters.push(match);
  }

  if (status) {
    filters.push(eq(employees.status, status));
  }

  if (departmentId) {
    filters.push(eq(employees.departmentId, departmentId));
  }

  const where = filters.length
    ? and(...filters)
    : undefined;

  // Keep queries sequential with the existing DB pool.
  const records = await db
    .select(employeeProjection)
    .from(employees)
    .innerJoin(
      departments,
      eq(employees.departmentId, departments.id),
    )
    .leftJoin(
      users,
      eq(employees.userId, users.id),
    )
    .where(where)
    .orderBy(
      sortDir === "desc"
        ? desc(sortColumn)
        : asc(sortColumn),
      asc(employees.id),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = await db.$count(employees, where);

  return { records, total };
}

/**
 * Get a single employee with department and linked account details.
 */
export async function getEmployeeById(id: string) {
  const [record] = await db
    .select(employeeProjection)
    .from(employees)
    .innerJoin(
      departments,
      eq(employees.departmentId, departments.id),
    )
    .leftJoin(
      users,
      eq(employees.userId, users.id),
    )
    .where(eq(employees.id, id))
    .limit(1);

  return record;
}

/**
 * Get active user accounts for the employee account selector.
 * Never expose password hashes.
 */
export async function getEmployeeAccountOptions() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.name), asc(users.id))
    .limit(100);
}

// ============================================================
// REFERENCE LOOKUPS
// ============================================================

/**
 * Check whether a department exists.
 */
export async function departmentExists(id: string): Promise<boolean> {
  const [record] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  return Boolean(record);
}

/**
 * Check whether a user exists and is active.
 */
export async function activeUserExists(id: string): Promise<boolean> {
  const [record] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, id),
        eq(users.isActive, true),
      ),
    )
    .limit(1);

  return Boolean(record);
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * Create an employee and return the new ID.
 */
export async function createEmployeeRecord(
  input: CreateEmployeeInput,
) {
  const [created] = await db
    .insert(employees)
    .values(input)
    .returning({ id: employees.id });

  return created;
}

/**
 * Update an employee and refresh updatedAt.
 * Returns undefined if the employee doesn't exist.
 */
export async function updateEmployeeRecord(
  id: string,
  updates: UpdateEmployeeInput,
) {
  const [updated] = await db
    .update(employees)
    .set({
      ...updates,
      updatedAt: sql`now()`,
    })
    .where(eq(employees.id, id))
    .returning({ id: employees.id });

  return updated;
}

/**
 * Delete an employee.
 * Existing foreign-key constraints still apply.
 */
export async function deleteEmployeeRecord(id: string) {
  const [deleted] = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning({ id: employees.id });

  return deleted;
}
