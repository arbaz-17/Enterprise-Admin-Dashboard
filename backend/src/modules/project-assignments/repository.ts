import { and, asc, eq, ilike, notExists, or } from "drizzle-orm";

import { db } from "../../db/index.js";

import {
  clients,
  departments,
  employees,
  projectAssignments,
  projects,
} from "../../db/schema.js";

import { escapeLike } from "../../lib/search.js";

import type { AssignmentOptionsQuery } from "./schemas.js";

// ============================================================
// PROJECTIONS
// ============================================================

const memberProjection = {
  id: projectAssignments.id,
  employeeId: projectAssignments.employeeId,
  fullName: employees.fullName,
  workEmail: employees.workEmail,
  designation: employees.designation,
  status: employees.status,
  departmentName: departments.name,
  assignedAt: projectAssignments.assignedAt,
};

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * Retrieve basic project information used by
 * team listing and authorization.
 */
export async function getAssignmentProject(projectId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.name,
      managerEmployeeId: projects.managerEmployeeId,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  return project;
}

/**
 * Return all members assigned to a project.
 */
export async function listProjectMembers(projectId: string) {
  return db
    .select(memberProjection)
    .from(projectAssignments)
    .innerJoin(employees, eq(projectAssignments.employeeId, employees.id))
    .innerJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(projectAssignments.projectId, projectId))
    .orderBy(asc(employees.fullName), asc(employees.id));
}

/**
 * Return active employees who aren't already
 * assigned to the specified project.
 *
 * Search uses literal LIKE escaping.
 * Maximum 20 results, matching existing behavior.
 */
export async function listAvailableEmployees(
  projectId: string,
  query: AssignmentOptionsQuery,
) {
  const q = escapeLike(query.q);

  const available = notExists(
    db
      .select({ id: projectAssignments.id })
      .from(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, projectId),
          eq(projectAssignments.employeeId, employees.id),
        ),
      ),
  );

  const search = q
    ? or(
        ilike(employees.fullName, `%${q}%`),
        ilike(employees.workEmail, `%${q}%`),
      )
    : undefined;

  return db
    .select({
      id: employees.id,
      name: employees.fullName,
      email: employees.workEmail,
      designation: employees.designation,
      departmentName: departments.name,
    })
    .from(employees)
    .innerJoin(departments, eq(employees.departmentId, departments.id))
    .where(and(eq(employees.status, "active"), available, search))
    .orderBy(asc(employees.fullName), asc(employees.id))
    .limit(20);
}

/**
 * Check whether the employee exists and is active.
 */
export async function isActiveEmployee(employeeId: string) {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.status, "active")))
    .limit(1);

  return Boolean(employee);
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * Assign an employee to a project.
 *
 * The database unique constraint prevents
 * duplicate project/employee combinations.
 */
export async function createProjectAssignment(
  projectId: string,
  employeeId: string,
) {
  const [created] = await db
    .insert(projectAssignments)
    .values({
      projectId,
      employeeId,
    })
    .returning({
      id: projectAssignments.id,
    });

  return created;
}

/**
 * Remove an employee from a project.
 *
 * Returns undefined if the assignment doesn't exist.
 */
export async function deleteProjectAssignment(
  projectId: string,
  employeeId: string,
) {
  const [deleted] = await db
    .delete(projectAssignments)
    .where(
      and(
        eq(projectAssignments.projectId, projectId),
        eq(projectAssignments.employeeId, employeeId),
      ),
    )
    .returning({
      id: projectAssignments.id,
    });

  return deleted;
}
