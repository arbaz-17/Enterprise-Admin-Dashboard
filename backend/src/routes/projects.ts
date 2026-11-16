import { Router } from "express";

import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

import { actorCanEdit, managedEmployeeId } from "../modules/projects/access.js";

import {
  uuidParams,
  listQuerySchema,
  createProjectSchema,
  adminUpdateSchema,
  managerUpdateSchema,
  type ProjectFields,
} from "../modules/projects/schemas.js";

import {
  getProjectById,
  listProjects,
  getProjectFormOptions,
  getProjectForUpdate,
  createProjectRecord,
  updateProjectRecord,
  deleteProjectRecord,
} from "../modules/projects/repository.js";

import {
  checkProjectReferences,
  validDates,
  validCompletedProgress,
  determineCompletedAt,
} from "../modules/projects/services.js";

import { getPostgresErrorCode } from "../lib/postgres-error.js";
import { createPagination } from "../lib/pagination.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

// GET /api/projects
projectsRouter.get(
  "/",
  requirePermission("projects:read"),
  async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project list filters",
        },
      });
      return;
    }

    const { page, pageSize } = parsed.data;
    const { records, total } = await listProjects(parsed.data);

    const actor = req.authUser!;

    const employeeId =
      actor.role === "manager" ? await managedEmployeeId(actor.id) : null;

    const data = records.map((record) => ({
      ...record,
      canEdit:
        actor.role === "admin" ||
        (actor.role === "manager" &&
          !!employeeId &&
          record.managerEmployeeId === employeeId),
    }));

    res.json({
      data,
      pagination: createPagination({
        page,
        pageSize,
        total,
      }),
    });
  },
);

// GET /api/projects/form-options
projectsRouter.get(
  "/form-options",
  requirePermission("projects:create"),
  async (_req, res) => {
    const options = await getProjectFormOptions();

    res.json(options);
  },
);

// GET /api/projects/:id
projectsRouter.get(
  "/:id",
  requirePermission("projects:read"),
  async (req, res) => {
    const parsed = uuidParams.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project ID",
        },
      });
      return;
    }

    const record = await getProjectById(parsed.data.id);

    if (!record) {
      res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      });
      return;
    }

    const actor = req.authUser!;

    res.json({
      data: {
        ...record,
        canEdit: await actorCanEdit(
          actor.role,
          actor.id,
          record.managerEmployeeId,
        ),
      },
    });
  },
);

// POST /api/projects — Admin only
projectsRouter.post(
  "/",
  requireTrustedOrigin,
  requirePermission("projects:create"),
  async (req, res) => {
    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project data",
        },
      });
      return;
    }

    const input = parsed.data;

    if (
      !validDates(input.startDate, input.dueDate) ||
      !validCompletedProgress(input.status, input.progress)
    ) {
      res.status(400).json({
        error: {
          code: "INVALID_PROJECT_DATES_OR_PROGRESS",
          message:
            "Check the project date order and ensure completed projects have 100% progress",
        },
      });
      return;
    }

    const invalid = await checkProjectReferences(input);

    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    try {
      const created = await createProjectRecord(
        input,
        determineCompletedAt(input.status),
      );

      const record = await getProjectById(created.id);

      res
        .status(201)
        .location(`/api/projects/${created.id}`)
        .json({
          data: {
            ...record!,
            canEdit: true,
          },
        });
    } catch (error) {
      if (getPostgresErrorCode(error) === "23503") {
        res.status(409).json({
          error: {
            code: "INVALID_RELATION",
            message: "Client or manager no longer exists",
          },
        });
        return;
      }

      throw error;
    }
  },
);

// PATCH /api/projects/:id
// Admin: full editing.
// Manager: status/progress on assigned projects only.
projectsRouter.patch(
  "/:id",
  requireTrustedOrigin,
  requirePermission("projects:manage"),
  async (req, res) => {
    const params = uuidParams.safeParse(req.params);
    const actor = req.authUser!;

    const body =
      actor.role === "admin"
        ? adminUpdateSchema.safeParse(req.body)
        : managerUpdateSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project update or unauthorized fields",
        },
      });
      return;
    }

    // Fetch the original database record.
    const existing = await getProjectForUpdate(params.data.id);

    if (!existing) {
      res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      });
      return;
    }

    // Verify project-specific edit permission.
    if (
      !(await actorCanEdit(actor.role, actor.id, existing.managerEmployeeId))
    ) {
      res.status(403).json({
        error: {
          code: "PROJECT_NOT_ASSIGNED",
          message: "You can only update projects assigned to you",
        },
      });
      return;
    }

    const updates: Partial<ProjectFields> = body.data;

    const status = updates.status ?? existing.status;
    const progress = updates.progress ?? existing.progress;

    const start =
      "startDate" in updates ? updates.startDate : existing.startDate;

    const due = "dueDate" in updates ? updates.dueDate : existing.dueDate;

    if (!validDates(start, due) || !validCompletedProgress(status, progress)) {
      res.status(400).json({
        error: {
          code: "INVALID_PROJECT_DATES_OR_PROGRESS",
          message:
            "Check project dates and ensure completed projects have 100% progress",
        },
      });
      return;
    }

    if (actor.role === "admin") {
      const invalid = await checkProjectReferences(updates, existing);

      if (invalid) {
        res.status(400).json({ error: invalid });
        return;
      }
    }

    const completedAt = determineCompletedAt(status, existing);

    try {
      // The manager assignment condition remains part of
      // the database UPDATE, not only a prior permission check.
      const updated = await updateProjectRecord({
        id: existing.id,
        updates,
        completedAt,
        guard:
          actor.role === "manager"
            ? {
                type: "manager-assignment",
                managerEmployeeId: existing.managerEmployeeId!,
              }
            : { type: "id-only" },
      });

      if (!updated) {
        res.status(actor.role === "manager" ? 403 : 404).json({
          error: {
            code: "PROJECT_NOT_ASSIGNED_OR_NOT_FOUND",
            message: "Project is no longer available for editing",
          },
        });
        return;
      }

      const record = await getProjectById(updated.id);

      res.json({
        data: {
          ...record!,
          canEdit: await actorCanEdit(
            actor.role,
            actor.id,
            record!.managerEmployeeId,
          ),
        },
      });
    } catch (error) {
      if (getPostgresErrorCode(error) === "23503") {
        res.status(409).json({
          error: {
            code: "INVALID_RELATION",
            message: "Client or manager no longer exists",
          },
        });
        return;
      }

      throw error;
    }
  },
);

// DELETE /api/projects/:id — Admin only
projectsRouter.delete(
  "/:id",
  requireTrustedOrigin,
  requirePermission("projects:delete"),
  async (req, res) => {
    const params = uuidParams.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project ID",
        },
      });
      return;
    }

    try {
      const deleted = await deleteProjectRecord(params.data.id);

      if (!deleted) {
        res.status(404).json({
          error: {
            code: "PROJECT_NOT_FOUND",
            message: "Project not found",
          },
        });
        return;
      }

      res.sendStatus(204);
    } catch (error) {
      if (getPostgresErrorCode(error) === "23503") {
        res.status(409).json({
          error: {
            code: "PROJECT_IN_USE",
            message:
              "Remove project team assignments before deleting the project",
          },
        });
        return;
      }

      throw error;
    }
  },
);
