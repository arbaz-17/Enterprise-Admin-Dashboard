import { Router } from "express";

// Middleware
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

// Schemas
import {
  uuidParams,
  listQuerySchema,
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../modules/employees/schemas.js";

// Repository
import {
  listEmployees,
  getEmployeeById,
  getEmployeeAccountOptions,
  createEmployeeRecord,
  updateEmployeeRecord,
  deleteEmployeeRecord,
} from "../modules/employees/repository.js";

// Services
import { validateEmployeeReferences } from "../modules/employees/services.js";

// Shared utilities
import { getPostgresErrorCode } from "../lib/postgres-error.js";
import { createPagination } from "../lib/pagination.js";

export const employeesRouter = Router();

employeesRouter.use(requireAuth);

// ============================================================
// Employee write conflict mapping
// ============================================================

/**
 * Maps database constraint violations to existing
 * employee-specific API errors.
 *
 * Used by both POST and PATCH.
 * HTTP status handling stays in the route.
 */
function getEmployeeWriteConflict(error: unknown) {
  const code = getPostgresErrorCode(error);

  if (code === "23505") {
    return {
      code: "EMPLOYEE_CONFLICT",
      message: "Work email or linked user account is already in use",
    };
  }

  if (code === "23503") {
    return {
      code: "INVALID_RELATION",
      message: "Department or user account is no longer available",
    };
  }

  return null;
}

// ============================================================
// GET /api/employees
// List employees with filtering, sorting and pagination.
// ============================================================

employeesRouter.get(
  "/",
  requirePermission("employees:read"),
  async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid employee filters",
        },
      });
      return;
    }

    const { page, pageSize } = parsed.data;

    const { records, total } = await listEmployees(parsed.data);

    res.json({
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
// GET /api/employees/account-options
// Get active user accounts for employee linking.
// ============================================================

// Keep this route BEFORE /:id.
employeesRouter.get(
  "/account-options",
  requirePermission("employees:manage"),
  async (_req, res) => {
    const records = await getEmployeeAccountOptions();

    res.json({ data: records });
  },
);

// ============================================================
// GET /api/employees/:id
// Get a single employee.
// ============================================================

employeesRouter.get(
  "/:id",
  requirePermission("employees:read"),
  async (req, res) => {
    const parsed = uuidParams.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid employee ID",
        },
      });
      return;
    }

    const employee = await getEmployeeById(parsed.data.id);

    if (!employee) {
      res.status(404).json({
        error: {
          code: "EMPLOYEE_NOT_FOUND",
          message: "Employee not found",
        },
      });
      return;
    }

    res.json({ data: employee });
  },
);

// ============================================================
// POST /api/employees
// Create an employee.
// ============================================================

employeesRouter.post(
  "/",
  requireTrustedOrigin,
  requirePermission("employees:manage"),
  async (req, res) => {
    // 1. Validate request data.
    const parsed = createEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid employee data",
        },
      });
      return;
    }

    // 2. Validate department and linked account.
    const invalid = await validateEmployeeReferences(parsed.data);

    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    try {
      // 3. Insert employee.
      const created = await createEmployeeRecord(parsed.data);

      // 4. Retrieve complete employee with relationships.
      const record = await getEmployeeById(created.id);

      res
        .status(201)
        .location(`/api/employees/${created.id}`)
        .json({ data: record });
    } catch (error) {
      const conflict = getEmployeeWriteConflict(error);

      if (conflict) {
        res.status(409).json({ error: conflict });
        return;
      }

      throw error;
    }
  },
);

// ============================================================
// PATCH /api/employees/:id
// Update an employee.
// ============================================================

employeesRouter.patch(
  "/:id",
  requireTrustedOrigin,
  requirePermission("employees:manage"),
  async (req, res) => {
    // 1. Validate parameters and update data.
    const params = uuidParams.safeParse(req.params);
    const body = updateEmployeeSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid employee update",
        },
      });
      return;
    }

    // 2. Validate changed references.
    const invalid = await validateEmployeeReferences(body.data);

    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    try {
      // 3. Update employee.
      const updated = await updateEmployeeRecord(params.data.id, body.data);

      if (!updated) {
        res.status(404).json({
          error: {
            code: "EMPLOYEE_NOT_FOUND",
            message: "Employee not found",
          },
        });
        return;
      }

      // 4. Return updated employee with relationships.
      const record = await getEmployeeById(updated.id);

      res.json({ data: record });
    } catch (error) {
      const conflict = getEmployeeWriteConflict(error);

      if (conflict) {
        res.status(409).json({ error: conflict });
        return;
      }

      throw error;
    }
  },
);

// ============================================================
// DELETE /api/employees/:id
// Delete employee (subject to foreign-key constraints).
// ============================================================

employeesRouter.delete(
  "/:id",
  requireTrustedOrigin,
  requirePermission("employees:manage"),
  async (req, res) => {
    // 1. Validate employee ID.
    const parsed = uuidParams.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid employee ID",
        },
      });
      return;
    }

    try {
      // 2. Delete employee.
      const deleted = await deleteEmployeeRecord(parsed.data.id);

      if (!deleted) {
        res.status(404).json({
          error: {
            code: "EMPLOYEE_NOT_FOUND",
            message: "Employee not found",
          },
        });
        return;
      }

      res.sendStatus(204);
    } catch (error) {
      if (getPostgresErrorCode(error) === "23503") {
        res.status(409).json({
          error: {
            code: "EMPLOYEE_IN_USE",
            message:
              "Remove project assignments and manager references before deleting this employee",
          },
        });
        return;
      }

      throw error;
    }
  },
);
