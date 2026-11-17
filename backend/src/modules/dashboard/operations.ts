import { and, asc, eq, isNull, ne, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { employees, projects } from "../../db/schema.js";
import { hasPermission, type Role } from "../../config/permissions.js";

const projectPriorities = ["high", "medium", "low"] as const;
const employeeStatuses = ["active", "on_leave", "inactive"] as const;

type AttentionReason = "overdue" | "on_hold" | "unassigned" | "due_soon";

// Dates are compared with PostgreSQL's CURRENT_DATE, so the boundary
// follows the database session timezone. Due soon includes today + 6 days.
const isDueSoon = sql<boolean>`
  ${projects.dueDate} >= CURRENT_DATE
  AND ${projects.dueDate} < CURRENT_DATE + 7
`;
const isOverdue = sql<boolean>`${projects.dueDate} < CURRENT_DATE`;

async function getProjectHealth() {
  const [row] = await db
    .select({
      overdue: sql<number>`count(*) FILTER (
        WHERE ${projects.status} <> 'completed' AND ${isOverdue}
      )::int`,
      dueSoon: sql<number>`count(*) FILTER (
        WHERE ${projects.status} <> 'completed' AND ${isDueSoon}
      )::int`,
      activeCount: sql<number>`count(*) FILTER (
        WHERE ${projects.status} = 'active'
      )::int`,
      averageActiveProgress: sql<number>`coalesce(round(avg(${projects.progress}) FILTER (
        WHERE ${projects.status} = 'active'
      )), 0)::int`,
    })
    .from(projects);

  return {
    overdue: row?.overdue ?? 0,
    dueSoon: row?.dueSoon ?? 0,
    activeCount: row?.activeCount ?? 0,
    averageActiveProgress: row?.averageActiveProgress ?? 0,
  };
}

async function getPriorityDistribution() {
  const counts = await db
    .select({
      priority: projects.priority,
      count: sql<number>`count(*)::int`,
    })
    .from(projects)
    .where(ne(projects.status, "completed"))
    .groupBy(projects.priority);

  const byPriority = new Map(counts.map((item) => [item.priority, item.count]));
  return projectPriorities.map((priority) => ({
    priority,
    count: byPriority.get(priority) ?? 0,
  }));
}

async function getEmployeeStatusDistribution() {
  const counts = await db
    .select({
      status: employees.status,
      count: sql<number>`count(*)::int`,
    })
    .from(employees)
    .groupBy(employees.status);

  const byStatus = new Map(counts.map((item) => [item.status, item.count]));
  return employeeStatuses.map((status) => ({
    status,
    count: byStatus.get(status) ?? 0,
  }));
}

async function getAttentionProjects(role: Role) {
  // Preserve the existing dashboard permission boundary: Viewers can
  // see aggregates, but not project names, IDs, or due dates.
  if (!hasPermission(role, "projects:read")) return [];

  const reason = sql<AttentionReason>`CASE
    WHEN ${isOverdue} THEN 'overdue'
    WHEN ${projects.status} = 'on_hold' THEN 'on_hold'
    WHEN ${projects.status} = 'active'
      AND ${projects.managerEmployeeId} IS NULL THEN 'unassigned'
    ELSE 'due_soon'
  END`;

  const priority = sql<number>`CASE
    WHEN ${isOverdue} THEN 0
    WHEN ${projects.status} = 'on_hold' THEN 1
    WHEN ${projects.status} = 'active'
      AND ${projects.managerEmployeeId} IS NULL THEN 2
    ELSE 3
  END`;

  return db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      progress: projects.progress,
      dueDate: projects.dueDate,
      reason,
    })
    .from(projects)
    .where(and(
      ne(projects.status, "completed"),
      or(
        isOverdue,
        isDueSoon,
        eq(projects.status, "on_hold"),
        and(eq(projects.status, "active"), isNull(projects.managerEmployeeId)),
      ),
    ))
    .orderBy(asc(priority), asc(projects.dueDate), asc(projects.name), asc(projects.id))
    .limit(5);
}

export async function getOperationsOverview(role: Role) {
  const [health, priorityDistribution, employeeStatus, attentionProjects] =
    await Promise.all([
      getProjectHealth(),
      getPriorityDistribution(),
      getEmployeeStatusDistribution(),
      getAttentionProjects(role),
    ]);

  return {
    health,
    priorityDistribution,
    employeeStatus,
    attentionProjects,
    canViewProjects: hasPermission(role, "projects:read"),
  };
}
