import { Router } from "express";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "../db/index.js";
import { clients, departments, employees, projects } from "../db/schema.js";
import { hasPermission, type Role } from "../config/permissions.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

const projectStatuses = ["planning", "active", "on_hold", "completed"] as const;

function utcMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

// Each helper performs only the queries required by its dashboard section.
// Database operations within a helper remain sequential, as in the original.
async function getStatusCounts() {
  return db
    .select({
      status: projects.status,
      count: sql<number>`count(*)::int`,
    })
    .from(projects)
    .groupBy(projects.status);
}

async function getMetrics() {
  const [employeeTotal] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(employees);

  const [clientTotal] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(clients);

  const [departmentTotal] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(departments);

  const statusCounts = await getStatusCounts();
  const statusCountMap = new Map(
    statusCounts.map((item) => [item.status, item.count]),
  );

  return {
    employees: employeeTotal?.total ?? 0,
    departments: departmentTotal?.total ?? 0,
    clients: clientTotal?.total ?? 0,
    totalProjects: statusCounts.reduce((sum, row) => sum + row.count, 0),
    activeProjects: statusCountMap.get("active") ?? 0,
    completedProjects: statusCountMap.get("completed") ?? 0,
  };
}

async function getMonthlyActivity() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const createdMonth = sql<string>`to_char(${projects.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM')`;
  const completedMonth = sql<string>`to_char(${projects.completedAt} AT TIME ZONE 'UTC', 'YYYY-MM')`;

  const createdCounts = await db
    .select({ month: createdMonth, count: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(gte(projects.createdAt, start), lt(projects.createdAt, end)))
    .groupBy(createdMonth);

  const completedCounts = await db
    .select({ month: completedMonth, count: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(gte(projects.completedAt, start), lt(projects.completedAt, end)))
    .groupBy(completedMonth);

  const createdByMonth = new Map(
    createdCounts.map((item) => [item.month, item.count]),
  );
  const completedByMonth = new Map(
    completedCounts.map((item) => [item.month, item.count]),
  );

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
    );
    const yearMonth = utcMonthKey(date);

    return {
      yearMonth,
      month: new Intl.DateTimeFormat("en", {
        month: "short",
        timeZone: "UTC",
      }).format(date),
      created: createdByMonth.get(yearMonth) ?? 0,
      completed: completedByMonth.get(yearMonth) ?? 0,
    };
  });
}

async function getProjectStatus() {
  const statusCounts = await getStatusCounts();
  const statusCountMap = new Map(
    statusCounts.map((item) => [item.status, item.count]),
  );

  return projectStatuses.map((status) => ({
    status,
    count: statusCountMap.get(status) ?? 0,
  }));
}

async function getDepartments() {
  const departmentCounts = await db
    .select({
      name: departments.name,
      employees: sql<number>`count(${employees.id})::int`,
    })
    .from(departments)
    .leftJoin(employees, eq(employees.departmentId, departments.id))
    .groupBy(departments.id, departments.name)
    .orderBy(desc(sql`count(${employees.id})`), asc(departments.name));

  // Preserve all employees: show the top 7 departments and group the rest.
  const top = departmentCounts.slice(0, 7);
  const remainder = departmentCounts.slice(7);

  return [
    ...top,
    ...(remainder.length
      ? [
          {
            name: "Other departments",
            employees: remainder.reduce((sum, row) => sum + row.employees, 0),
          },
        ]
      : []),
  ];
}

async function getRecentProjects(role: Role) {
  // Aggregate dashboard data is available to Viewers; project details aren't.
  const canViewProjects = hasPermission(role, "projects:read");

  const recentProjects = canViewProjects
    ? await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          clientName: clients.name,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .innerJoin(clients, eq(projects.clientId, clients.id))
        .orderBy(desc(projects.updatedAt), desc(projects.id))
        .limit(5)
    : [];

  return { recentProjects, canViewProjects };
}

// Independent endpoints. A failure in one doesn't prevent the others
// from returning their own responses.
dashboardRouter.get(
  "/metrics",
  requirePermission("dashboard:read"),
  async (_req, res) => {
    const metrics = await getMetrics();
    res.status(200).json({
      data: { metrics, generatedAt: new Date().toISOString() },
    });
  },
);

dashboardRouter.get(
  "/monthly-activity",
  requirePermission("dashboard:read"),
  async (_req, res) => {
    const monthlyActivity = await getMonthlyActivity();
    res.status(200).json({
      data: { monthlyActivity, generatedAt: new Date().toISOString() },
    });
  },
);

dashboardRouter.get(
  "/project-status",
  requirePermission("dashboard:read"),
  async (_req, res) => {
    const projectStatus = await getProjectStatus();
    res.status(200).json({
      data: { projectStatus, generatedAt: new Date().toISOString() },
    });
  },
);

dashboardRouter.get(
  "/departments",
  requirePermission("dashboard:read"),
  async (_req, res) => {
    const departments = await getDepartments();
    res.status(200).json({
      data: { departments, generatedAt: new Date().toISOString() },
    });
  },
);

dashboardRouter.get(
  "/recent-projects",
  requirePermission("dashboard:read"),
  async (req, res) => {
    const { recentProjects, canViewProjects } = await getRecentProjects(
      req.authUser!.role,
    );

    res.status(200).json({
      data: {
        recentProjects,
        canViewProjects,
        generatedAt: new Date().toISOString(),
      },
    });
  },
);
