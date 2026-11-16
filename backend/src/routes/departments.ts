import { Router, type Response } from "express";

// Middleware
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

// Schemas
import {
  idParamsSchema,
  listQuerySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../modules/departments/schemas.js";

// Repository
import {
  listDepartments,
  getDepartmentById,
  createDepartmentRecord,
  updateDepartmentRecord,
  deleteDepartmentRecord,
} from "../modules/departments/repository.js";

// Shared utilities
import { getPostgresErrorCode } from "../lib/postgres-error.js";
import { createPagination } from "../lib/pagination.js";

export const departmentsRouter = Router();

// All department endpoints require authentication.
departmentsRouter.use(requireAuth);

// ============================================================
// SHARED ERROR RESPONSE
// ============================================================

/**
 * Used by both POST and PATCH when the department
 * name violates a database unique constraint.
 */
function sendDuplicateDepartmentError(res: Response): void {
  res.status(409).json({
    error: {
      code: "DEPARTMENT_ALREADY_EXISTS",
      message: "A department with this name already exists",
    },
  });
}

// ============================================================
// GET /api/departments
// List departments with search, sorting and pagination.
// ============================================================

departmentsRouter.get(
  "/",
  requirePermission("departments:read"),
  async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
        },
      });
      return;
    }

    const { page, pageSize } = parsed.data;

    const { records, total } = await listDepartments(parsed.data);

    res.status(200).json({
      data: records,
      pagination: createPagination({
        page,
        pageSize,
        total,
      }),
    });
  },
);

// ============================================================
// GET /api/departments/:id
// Fetch a department by UUID.
// ============================================================

departmentsRouter.get(
  "/:id",
  requirePermission("departments:read"),
  async (req, res) => {
    const parsed = idParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid department ID",
        },
      });
      return;
    }

    const department = await getDepartmentById(parsed.data.id);

    if (!department) {
      res.status(404).json({
        error: {
          code: "DEPARTMENT_NOT_FOUND",
          message: "Department not found",
        },
      });
      return;
    }

    res.status(200).json({
      data: department,
    });
  },
);

// ============================================================
// POST /api/departments
// Create a department.
// ============================================================

departmentsRouter.post(
  "/",
  requireTrustedOrigin,
  requirePermission("departments:manage"),
  async (req, res) => {
    const parsed = createDepartmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid department data",
        },
      });
      return;
    }

    try {
      const department = await createDepartmentRecord(parsed.data);

      res.location(`/api/departments/${department.id}`).status(201).json({
        data: department,
      });
    } catch (error) {
      if (getPostgresErrorCode(error) === "23505") {
        sendDuplicateDepartmentError(res);
        return;
      }

      throw error;
    }
  },
);

// ============================================================
// PATCH /api/departments/:id
// Update an existing department.
// ============================================================

departmentsRouter.patch(
  "/:id",
  requireTrustedOrigin,
  requirePermission("departments:manage"),
  async (req, res) => {
    const params = idParamsSchema.safeParse(req.params);
    const body = updateDepartmentSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid department update request",
        },
      });
      return;
    }

    try {
      const department = await updateDepartmentRecord(
        params.data.id,
        body.data,
      );

      if (!department) {
        res.status(404).json({
          error: {
            code: "DEPARTMENT_NOT_FOUND",
            message: "Department not found",
          },
        });
        return;
      }

      res.status(200).json({
        data: department,
      });
    } catch (error) {
      if (getPostgresErrorCode(error) === "23505") {
        sendDuplicateDepartmentError(res);
        return;
      }

      throw error;
    }
  },
);

// ============================================================
// DELETE /api/departments/:id
// Delete department if no dependent records prevent it.
// ============================================================

departmentsRouter.delete(
  "/:id",
  requireTrustedOrigin,
  requirePermission("departments:manage"),
  async (req, res) => {
    const parsed = idParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid department ID",
        },
      });
      return;
    }

    try {
      const deleted = await deleteDepartmentRecord(parsed.data.id);

      if (!deleted) {
        res.status(404).json({
          error: {
            code: "DEPARTMENT_NOT_FOUND",
            message: "Department not found",
          },
        });
        return;
      }

      res.sendStatus(204);
    } catch (error) {
      if (getPostgresErrorCode(error) === "23503") {
        res.status(409).json({
          error: {
            code: "DEPARTMENT_IN_USE",
            message: "Reassign employees before deleting this department",
          },
        });
        return;
      }

      throw error;
    }
  },
);
