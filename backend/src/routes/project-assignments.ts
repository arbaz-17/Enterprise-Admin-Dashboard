import { Router, type Response } from "express";

// Middleware
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

// Existing project authorization
import { actorCanEdit } from "../modules/projects/access.js";

// Schemas
import {
  projectParamsSchema,
  memberParamsSchema,
  addMemberSchema,
  optionsQuerySchema,
} from "../modules/project-assignments/schemas.js";

// Repository
import {
  getAssignmentProject,
  listProjectMembers,
  listAvailableEmployees,
  createProjectAssignment,
  deleteProjectAssignment,
} from "../modules/project-assignments/repository.js";

// Services
import {
  authorizeTeamMutation,
  validateAssignableEmployee,
  type TeamAccessResult,
} from "../modules/project-assignments/services.js";

// Shared utilities
import { getPostgresErrorCode } from "../lib/postgres-error.js";

// This router is mounted under:
// /api/projects/:projectId/assignments
//
// mergeParams exposes the parent projectId.
export const projectAssignmentsRouter = Router({
  mergeParams: true,
});

projectAssignmentsRouter.use(requireAuth);

// ============================================================
// ACCESS ERROR RESPONSES
// ============================================================

type TeamAccessFailure = Exclude<TeamAccessResult, "ok">;

/**
 * Translate project access failures
 * into the existing API response format.
 */
function sendAccessFailure(res: Response, result: TeamAccessFailure): void {
  if (result === "not-found") {
    res.status(404).json({
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found",
      },
    });
    return;
  }

  res.status(403).json({
    error: {
      code: "PROJECT_NOT_ASSIGNED",
      message: "You can only manage members of projects assigned to you",
    },
  });
}

// ============================================================
// GET /api/projects/:projectId/assignments
// List project team members.
// ============================================================

projectAssignmentsRouter.get(
  "/",
  requirePermission("projects:read"),
  async (req, res) => {
    const params = projectParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project ID",
        },
      });
      return;
    }

    // 1. Verify the project exists.
    const project = await getAssignmentProject(params.data.projectId);

    if (!project) {
      res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      });
      return;
    }

    // 2. Retrieve project members.
    const members = await listProjectMembers(project.id);

    // 3. Include management capability for the UI.
    const actor = req.authUser!;

    const canManageTeam = await actorCanEdit(
      actor.role,
      actor.id,
      project.managerEmployeeId,
    );

    res.json({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        canManageTeam,
      },
      data: members,
    });
  },
);

// ============================================================
// GET /api/projects/:projectId/assignments/options
// Search available employees.
// ============================================================

// Keep this route before routes with employeeId parameters.
projectAssignmentsRouter.get(
  "/options",
  requirePermission("assignments:manage"),
  async (req, res) => {
    const params = projectParamsSchema.safeParse(req.params);
    const query = optionsQuerySchema.safeParse(req.query);

    if (!params.success || !query.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid employee search",
        },
      });
      return;
    }

    // 1. Check project ownership/authorization.
    const access = await authorizeTeamMutation(
      req.authUser!,
      params.data.projectId,
    );

    if (access !== "ok") {
      sendAccessFailure(res, access);
      return;
    }

    // 2. Find eligible employees not already assigned.
    const options = await listAvailableEmployees(
      params.data.projectId,
      query.data,
    );

    res.json({ data: options });
  },
);

// ============================================================
// POST /api/projects/:projectId/assignments
// Add an employee to a project team.
// ============================================================

projectAssignmentsRouter.post(
  "/",
  requireTrustedOrigin,
  requirePermission("assignments:manage"),
  async (req, res) => {
    const params = projectParamsSchema.safeParse(req.params);
    const body = addMemberSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Provide a valid employee ID",
        },
      });
      return;
    }

    // 1. Verify permission to manage this team.
    const access = await authorizeTeamMutation(
      req.authUser!,
      params.data.projectId,
    );

    if (access !== "ok") {
      sendAccessFailure(res, access);
      return;
    }

    // 2. Validate employee eligibility.
    const invalid = await validateAssignableEmployee(body.data.employeeId);

    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    try {
      // 3. Create the assignment.
      const created = await createProjectAssignment(
        params.data.projectId,
        body.data.employeeId,
      );

      res
        .status(201)
        .location(`/api/projects/${params.data.projectId}/assignments`)
        .json({
          data: {
            id: created.id,
          },
        });
    } catch (error) {
      const code = getPostgresErrorCode(error);

      // Employee already assigned to the project.
      if (code === "23505") {
        res.status(409).json({
          error: {
            code: "ALREADY_ASSIGNED",
            message: "This employee is already on the project team",
          },
        });
        return;
      }

      // Project/employee was removed after validation.
      if (code === "23503") {
        res.status(409).json({
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

// ============================================================
// DELETE /api/projects/:projectId/assignments/:employeeId
// Remove an employee from a project team.
// ============================================================

projectAssignmentsRouter.delete(
  "/:employeeId",
  requireTrustedOrigin,
  requirePermission("assignments:manage"),
  async (req, res) => {
    const params = memberParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project or employee ID",
        },
      });
      return;
    }

    // 1. Verify project ownership/authorization.
    const access = await authorizeTeamMutation(
      req.authUser!,
      params.data.projectId,
    );

    if (access !== "ok") {
      sendAccessFailure(res, access);
      return;
    }

    // 2. Remove the assignment.
    const deleted = await deleteProjectAssignment(
      params.data.projectId,
      params.data.employeeId,
    );

    if (!deleted) {
      res.status(404).json({
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
