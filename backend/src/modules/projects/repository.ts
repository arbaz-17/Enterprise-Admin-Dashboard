
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "../../db/index.js";
import {
  clients,
  employees,
  projects,
  users,
} from "../../db/schema.js";
import { escapeLike } from "../../lib/search.js";

import type { ProjectListQuery,CreateProjectInput,ProjectFields } from "./schemas.js";

// Shared project projection used by list and detail queries.
const projectProjection = {
  id: projects.id,
  name: projects.name,
  description: projects.description,
  clientId: projects.clientId,
  clientName: clients.name,
  managerEmployeeId: projects.managerEmployeeId,
  managerName: employees.fullName,
  status: projects.status,
  priority: projects.priority,
  progress: projects.progress,
  startDate: projects.startDate,
  dueDate: projects.dueDate,
  completedAt: projects.completedAt,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

/**
 * Fetch a single project with its client and manager.
 */
export async function getProjectById(id: string) {
  const [record] = await db
    .select(projectProjection)
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(
      employees,
      eq(projects.managerEmployeeId, employees.id),
    )
    .where(eq(projects.id, id))
    .limit(1);

  return record;
}

/**
 * Fetch a paginated, filtered and sorted project list.
 * Also returns the total matching record count.
 */
export async function listProjects(query: ProjectListQuery) {
  const {
    page,
    pageSize,
    q,
    status,
    priority,
    clientId,
    sortBy,
    sortDir,
  } = query;

  // Custom priority ordering: high > medium > low.
  const priorityRank = sql<number>`
    CASE ${projects.priority}
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      ELSE 1
    END
  `;

  const sortColumns = {
    name: projects.name,
    clientName: clients.name,
    managerName: employees.fullName,
    status: projects.status,
    priority: priorityRank,
    progress: projects.progress,
    dueDate: projects.dueDate,
  };

  const sortColumn = sortColumns[sortBy];

  // Build optional filters.
  const filters: SQL[] = [];

  if (q) {
    const pattern = `%${escapeLike(q)}%`;

    const search = or(
      ilike(projects.name, pattern),
      ilike(clients.name, pattern),
    );

    if (search) filters.push(search);
  }

  if (status) {
    filters.push(eq(projects.status, status));
  }

  if (priority) {
    filters.push(eq(projects.priority, priority));
  }

  if (clientId) {
    filters.push(eq(projects.clientId, clientId));
  }

  const where = filters.length
    ? and(...filters)
    : undefined;

  // Keep queries sequential with the existing DB pool.
  const records = await db
    .select(projectProjection)
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(
      employees,
      eq(projects.managerEmployeeId, employees.id),
    )
    .where(where)
    .orderBy(
      sortDir === "desc"
        ? desc(sortColumn)
        : asc(sortColumn),
      asc(projects.id),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [count] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(where);

  return {
    records,
    total: count?.total ?? 0,
  };
}

/**
 * Return clients and eligible managers
 * for the project creation/editing form.
 *
 * Authorization is enforced by the route.
 */
export async function getProjectFormOptions() {
  const clientOptions = await db
    .select({
      id: clients.id,
      name: clients.name,
      status: clients.status,
    })
    .from(clients)
    .orderBy(asc(clients.name));

  const managerOptions = await db
    .select({
      id: employees.id,
      name: employees.fullName,
      email: employees.workEmail,
    })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .where(
      and(
        eq(employees.status, "active"),
        eq(users.isActive, true),
        inArray(users.role, ["admin", "manager"]),
      ),
    )
    .orderBy(asc(employees.fullName));

  return {
    clients: clientOptions,
    managers: managerOptions,
  };
}



/**
 * Returns the status of a client, or null if it doesn't exist.
 */
export async function getClientStatusById(clientId: string) {
  const [client] = await db
    .select({ status: clients.status })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  return client?.status ?? null;
}

/**
 * Checks whether an employee is eligible to manage projects.
 *
 * Eligible employee:
 * - Has active employee status
 * - Has a linked active user account
 * - Has Admin or Manager role
 */
export async function isEligibleProjectManager(employeeId: string) {
  const [manager] = await db
    .select({ id: employees.id })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.status, "active"),
        eq(users.isActive, true),
        inArray(users.role, ["admin", "manager"]),
      ),
    )
    .limit(1);

  return Boolean(manager);
}



/**
 * Fetch the original database record before an update.
 * Unlike getProjectById(), this doesn't join other tables.
 */
export async function getProjectForUpdate(id: string) {
  const [record] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  return record;
}

/**
 * Insert a new project.
 *
 * Business rules and completedAt calculations are handled
 * by the service and route before calling this function.
 */
export async function createProjectRecord(
  input: CreateProjectInput,
  completedAt: Date | null,
) {
  const [created] = await db
    .insert(projects)
    .values({
      ...input,
      completedAt,
    })
    .returning({ id: projects.id });

  return created;
}

/**
 * Defines which records a project update may affect.
 *
 * The route chooses the scope after checking authorization.
 */
type ProjectUpdateGuard =
  | { type: "id-only" }
  | {
      type: "manager-assignment";
      managerEmployeeId: string;
    };

interface UpdateProjectOptions {
  id: string;
  updates: Partial<ProjectFields>;
  completedAt: Date | null;
  guard: ProjectUpdateGuard;
}

/**
 * Update a project.
 *
 * For manager updates, the assignment check is performed
 * inside the SQL UPDATE itself, protecting against
 * reassignment between the initial read and the write.
 */
export async function updateProjectRecord({
  id,
  updates,
  completedAt,
  guard,
}: UpdateProjectOptions) {
  const where =
    guard.type === "manager-assignment"
      ? and(
          eq(projects.id, id),
          eq(projects.managerEmployeeId, guard.managerEmployeeId),
        )
      : eq(projects.id, id);

  const [updated] = await db
    .update(projects)
    .set({
      ...updates,
      completedAt,
      updatedAt: sql`now()`,
    })
    .where(where)
    .returning({ id: projects.id });

  return updated;
}

/**
 * Delete a project by ID.
 *
 * Database foreign-key constraints still protect
 * projects that have dependent team assignments.
 */
export async function deleteProjectRecord(id: string) {
  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ id: projects.id });

  return deleted;
}
