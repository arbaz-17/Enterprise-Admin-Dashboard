import { asc, desc, eq, ilike, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { departments } from "../../db/schema.js";

import type {
  DepartmentListQuery,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./schemas.js";

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * Fetch departments with search, sorting and pagination.
 *
 * Returns matching records and their total count.
 */
export async function listDepartments(query: DepartmentListQuery) {
  const { page, pageSize, q, sortBy, sortDir } = query;

  const sortColumns = {
    name: departments.name,
    description: departments.description,
    createdAt: departments.createdAt,
  };

  const sortColumn = sortColumns[sortBy];

  // Preserve existing search behavior.
  const filter = q ? ilike(departments.name, `%${q}%`) : undefined;

  // Keep database reads sequential.
  const records = await db
    .select()
    .from(departments)
    .where(filter)
    .orderBy(
      sortDir === "desc" ? desc(sortColumn) : asc(sortColumn),
      asc(departments.id),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = await db.$count(departments, filter);

  return {
    records,
    total,
  };
}

/**
 * Fetch a single department by ID.
 *
 * Returns undefined if no department exists.
 */
export async function getDepartmentById(id: string) {
  const [department] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  return department;
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * Create a department.
 *
 * Database unique constraints protect against
 * duplicate department names.
 */
export async function createDepartmentRecord(input: CreateDepartmentInput) {
  const [created] = await db.insert(departments).values(input).returning();

  return created;
}

/**
 * Update a department.
 *
 * Explicitly refresh updatedAt.
 * Returns undefined if the record doesn't exist.
 */
export async function updateDepartmentRecord(
  id: string,
  updates: UpdateDepartmentInput,
) {
  const [updated] = await db
    .update(departments)
    .set({
      ...updates,
      updatedAt: sql`now()`,
    })
    .where(eq(departments.id, id))
    .returning();

  return updated;
}

/**
 * Delete a department.
 *
 * Database foreign-key constraints prevent deletion
 * when dependent employee records exist.
 */
export async function deleteDepartmentRecord(id: string) {
  const [deleted] = await db
    .delete(departments)
    .where(eq(departments.id, id))
    .returning({
      id: departments.id,
    });

  return deleted;
}
