import { Router } from "express";
import { z } from "zod";
import { and, asc, eq, ilike, notExists, or } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  clients,
  departments,
  employees,
  projectAssignments,
  projects,
} from "../db/schema.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";
import { actorCanEdit } from "../modules/projects/access.js";

// Mounted at /api/projects/:projectId/assignments. mergeParams exposes the parent projectId.
export const projectAssignmentsRouter = Router({ mergeParams: true });
projectAssignmentsRouter.use(requireAuth);

const projectParamsSchema = z.object({ projectId: z.uuid() });
const memberParamsSchema = projectParamsSchema.extend({ employeeId: z.uuid() });
const addMemberSchema = z.strictObject({ employeeId: z.uuid() });
const optionsQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
});

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

function postgresErrorCode(error: unknown): string | null {
  let value: unknown = error;
  for (let i = 0; i < 4; i++) {
    if (!value || typeof value !== "object") return null;
    if ("code" in value && typeof value.code === "string") return value.code;
    value = "cause" in value ? value.cause : null;
  }
  return null;
}

async function getProject(projectId: string) {
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

async function authorizeTeamMutation(
  actor: NonNullable<Express.Request["authUser"]>,
  projectId: string,
): Promise<"ok" | "not-found" | "forbidden"> {
  const project = await getProject(projectId);
  if (!project) return "not-found";
  if (!(await actorCanEdit(actor.role, actor.id, project.managerEmployeeId)))
    return "forbidden";
  return "ok";
}

function sendAccessFailure(
  res: import("express").Response,
  result: "not-found" | "forbidden",
) {
  if (result === "not-found") {
    res
      .status(404)
      .json({
        error: { code: "PROJECT_NOT_FOUND", message: "Project not found" },
      });
  } else {
    res
      .status(403)
      .json({
        error: {
          code: "PROJECT_NOT_ASSIGNED",
          message: "You can only manage members of projects assigned to you",
        },
      });
  }
}

// GET /api/projects/:projectId/assignments — Admin/Manager may view teams.
projectAssignmentsRouter.get(
  "/",
  requirePermission("projects:read"),
  async (req, res) => {
    const params = projectParamsSchema.safeParse(req.params);
    if (!params.success) {
      res
        .status(400)
        .json({
          error: { code: "VALIDATION_ERROR", message: "Invalid project ID" },
        });
      return;
    }
    const project = await getProject(params.data.projectId);
    if (!project) {
      res
        .status(404)
        .json({
          error: { code: "PROJECT_NOT_FOUND", message: "Project not found" },
        });
      return;
    }

    const members = await db
      .select(memberProjection)
      .from(projectAssignments)
      .innerJoin(employees, eq(projectAssignments.employeeId, employees.id))
      .innerJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(projectAssignments.projectId, project.id))
      .orderBy(asc(employees.fullName), asc(employees.id));

    res.json({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        canManageTeam: await actorCanEdit(
          req.authUser!.role,
          req.authUser!.id,
          project.managerEmployeeId,
        ),
      },
      data: members,
    });
  },
);

// GET /api/projects/:projectId/assignments/options?q=... — up to 20 active, not-yet-assigned employees.
// This is intentionally before /:employeeId.
projectAssignmentsRouter.get(
  "/options",
  requirePermission("assignments:manage"),
  async (req, res) => {
    const params = projectParamsSchema.safeParse(req.params);
    const query = optionsQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid employee search",
          },
        });
      return;
    }
    const access = await authorizeTeamMutation(
      req.authUser!,
      params.data.projectId,
    );
    if (access !== "ok") return sendAccessFailure(res, access);

    const q = query.data.q.replace(/[\\%_]/g, "\\$&");
    const available = notExists(
      db
        .select({ id: projectAssignments.id })
        .from(projectAssignments)
        .where(
          and(
            eq(projectAssignments.projectId, params.data.projectId),
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

    // Sequential single request, compatible with the existing small Postgres.js pool.
    const options = await db
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

    res.json({ data: options });
  },
);

// POST /api/projects/:projectId/assignments — Admin or assigned Manager.
projectAssignmentsRouter.post(
  "/",
  requireTrustedOrigin,
  requirePermission("assignments:manage"),
  async (req, res) => {
    const params = projectParamsSchema.safeParse(req.params);
    const body = addMemberSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Provide a valid employee ID",
          },
        });
      return;
    }
    const access = await authorizeTeamMutation(
      req.authUser!,
      params.data.projectId,
    );
    if (access !== "ok") return sendAccessFailure(res, access);

    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.id, body.data.employeeId),
          eq(employees.status, "active"),
        ),
      )
      .limit(1);
    if (!employee) {
      res
        .status(400)
        .json({
          error: {
            code: "INVALID_EMPLOYEE",
            message: "Select an active employee",
          },
        });
      return;
    }

    try {
      const [created] = await db
        .insert(projectAssignments)
        .values({
          projectId: params.data.projectId,
          employeeId: body.data.employeeId,
        })
        .returning({ id: projectAssignments.id });
      res
        .status(201)
        .location(`/api/projects/${params.data.projectId}/assignments`)
        .json({ data: { id: created.id } });
    } catch (error) {
      const code = postgresErrorCode(error);
      if (code === "23505") {
        res
          .status(409)
          .json({
            error: {
              code: "ALREADY_ASSIGNED",
              message: "This employee is already on the project team",
            },
          });
        return;
      }
      if (code === "23503") {
        res
          .status(409)
          .json({
            error: {
              code: "ASSIGNMENT_RELATION_CHANGED",
              message: "Project or employee no longer exists",
            },
          });
        return;
      }
      throw error;
    }
  },
);

// DELETE /api/projects/:projectId/assignments/:employeeId — Admin or assigned Manager.
projectAssignmentsRouter.delete(
  "/:employeeId",
  requireTrustedOrigin,
  requirePermission("assignments:manage"),
  async (req, res) => {
    const params = memberParamsSchema.safeParse(req.params);
    if (!params.success) {
      res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid project or employee ID",
          },
        });
      return;
    }
    const access = await authorizeTeamMutation(
      req.authUser!,
      params.data.projectId,
    );
    if (access !== "ok") return sendAccessFailure(res, access);

    const [deleted] = await db
      .delete(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, params.data.projectId),
          eq(projectAssignments.employeeId, params.data.employeeId),
        ),
      )
      .returning({ id: projectAssignments.id });
    if (!deleted) {
      res
        .status(404)
        .json({
          error: {
            code: "ASSIGNMENT_NOT_FOUND",
            message: "Employee is not assigned to this project",
          },
        });
      return;
    }
    res.sendStatus(204);
  },
);
