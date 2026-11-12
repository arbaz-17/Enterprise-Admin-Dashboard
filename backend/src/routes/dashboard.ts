import { Router } from "express";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "../db/index.js";
import { clients, departments, employees, projects } from "../db/schema.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { hasPermission } from "../config/permissions.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

const projectStatuses = ["planning", "active", "on_hold", "completed"] as const;

function utcMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

// GET /api/dashboard/overview
// Returns real, organization-wide aggregates. No mock values or new DB tables.
// Keep database operations sequential with the application's existing Postgres.js pool.
dashboardRouter.get(
  "/overview",
  requirePermission("dashboard:read"),
  async (req, res) => {
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [employeeTotal] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(employees);

    const [clientTotal] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(clients);

    const departmentCounts = await db
      .select({
        name: departments.name,
        employees: sql<number>`count(${employees.id})::int`,
      })
      .from(departments)
      .leftJoin(employees, eq(employees.departmentId, departments.id))
      .groupBy(departments.id, departments.name)
      .orderBy(desc(sql`count(${employees.id})`), asc(departments.name));

    const statusCounts = await db
      .select({
        status: projects.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .groupBy(projects.status);

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
      .where(
        and(gte(projects.completedAt, start), lt(projects.completedAt, end)),
      )
      .groupBy(completedMonth);

    const createdByMonth = new Map(
      createdCounts.map((item) => [item.month, item.count]),
    );
    const completedByMonth = new Map(
      completedCounts.map((item) => [item.month, item.count]),
    );

    const monthlyActivity = Array.from({ length: 6 }, (_, index) => {
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

    const statusCountMap = new Map(
      statusCounts.map((item) => [item.status, item.count]),
    );
    const projectStatus = projectStatuses.map((status) => ({
      status,
      count: statusCountMap.get(status) ?? 0,
    }));

    // Project names and client names are details, not aggregate metrics.
    // Viewers may see dashboard aggregates but not project details.
    const canViewProjects = hasPermission(req.authUser!.role, "projects:read");
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

    // Preserve totals: show up to 7 departments and group the rest as "Other".
    const top = departmentCounts.slice(0, 7);
    const remainder = departmentCounts.slice(7);
    const departmentSummary = [
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

    res.status(200).json({
      data: {
        metrics: {
          employees: employeeTotal?.total ?? 0,
          departments: departmentCounts.length,
          clients: clientTotal?.total ?? 0,
          totalProjects: statusCounts.reduce((sum, row) => sum + row.count, 0),
          activeProjects: statusCountMap.get("active") ?? 0,
          completedProjects: statusCountMap.get("completed") ?? 0,
        },
        monthlyActivity,
        projectStatus,
        departments: departmentSummary,
        recentProjects,
        canViewProjects,
        generatedAt: new Date().toISOString(),
      },
    });
  },
);
