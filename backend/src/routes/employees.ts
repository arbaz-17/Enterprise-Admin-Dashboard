import { Router } from "express";
import { z } from "zod";
import { and, asc, eq, ilike, or, sql, desc, type SQL } from "drizzle-orm";

import { db } from "../db/index.js";
import { departments, employees, users } from "../db/schema.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

export const employeesRouter = Router();
employeesRouter.use(requireAuth);

const uuidParams = z.object({ id: z.uuid() });
const statusSchema = z.enum(["active", "on_leave", "inactive"]);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional(),
  status: statusSchema.optional(),
  departmentId: z.uuid().optional(),

  sortBy: z
    .enum([
      "fullName",
      "designation",
      "departmentName",
      "status",
      "joiningDate",
      "linkedUserName",
    ])
    .default("fullName"),

  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

const employeeFields = z.strictObject({
  fullName: z.string().trim().min(1).max(120),
  workEmail: z.string().trim().toLowerCase().email().max(254),
  designation: z.string().trim().min(1).max(100),
  departmentId: z.uuid(),
  userId: z.uuid().nullable(),
  status: statusSchema,
  joiningDate: z.iso.date().nullable(),
});
const createEmployeeSchema = employeeFields.extend({
  userId: z.uuid().nullable().optional(),
  joiningDate: z.iso.date().nullable().optional(),
  status: statusSchema.default("active"),
});
const updateEmployeeSchema = employeeFields
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update",
  );

const employeeProjection = {
  id: employees.id,
  fullName: employees.fullName,
  workEmail: employees.workEmail,
  designation: employees.designation,
  status: employees.status,
  departmentId: employees.departmentId,
  departmentName: departments.name,
  userId: employees.userId,
  linkedUserName: users.name,
  joiningDate: employees.joiningDate,
  createdAt: employees.createdAt,
  updatedAt: employees.updatedAt,
};

function pgErrorCode(error: unknown): string | null {
  let current = error;
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== "object") return null;
    if ("code" in current && typeof current.code === "string") {
      return current.code;
    }
    current = "cause" in current ? current.cause : null;
  }
  return null;
}

async function validateReferences(
  departmentId: string | undefined,
  userId: string | null | undefined,
): Promise<{ code: string; message: string; status: number } | null> {
  if (departmentId !== undefined) {
    const [department] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1);
    if (!department) {
      return {
        status: 400,
        code: "INVALID_DEPARTMENT",
        message: "Select an existing department",
      };
    }
  }
  if (userId) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1);
    if (!user) {
      return {
        status: 400,
        code: "INVALID_USER",
        message: "Linked user account must be active",
      };
    }
  }
  return null;
}

async function getEmployee(id: string) {
  const [record] = await db
    .select(employeeProjection)
    .from(employees)
    .innerJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .where(eq(employees.id, id))
    .limit(1);
  return record;
}

// GET /api/employees?page=1&pageSize=10&q=&status=&departmentId=
employeesRouter.get(
  "/",
  requirePermission("employees:read"),
  async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid employee filters",
          },
        });
      return;
    }

    const { page, pageSize, q, status, departmentId, sortBy, sortDir } =
      parsed.data;

    const sortColumns = {
      fullName: employees.fullName,
      designation: employees.designation,
      departmentName: departments.name,
      status: employees.status,
      joiningDate: employees.joiningDate,
      linkedUserName: users.name,
    };

    const sortColumn = sortColumns[sortBy];
    const filters: SQL[] = [];
    if (q) {
      const match = or(
        ilike(employees.fullName, `%${q}%`),
        ilike(employees.workEmail, `%${q}%`),
        ilike(employees.designation, `%${q}%`),
      );
      if (match) filters.push(match);
    }
    if (status) filters.push(eq(employees.status, status));
    if (departmentId) filters.push(eq(employees.departmentId, departmentId));
    const where = filters.length ? and(...filters) : undefined;

    // Sequential queries: preserve compatibility with the existing small Postgres.js pool.
    const records = await db
      .select(employeeProjection)
      .from(employees)
      .innerJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(where)
      .orderBy(
        sortDir === "desc" ? desc(sortColumn) : asc(sortColumn),
        asc(employees.id),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = await db.$count(employees, where);
    res.json({
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);

// GET /api/employees/account-options
// A small, admin-only account selector; does not expose password hashes.
// Keep this route BEFORE /:id so Express does not treat the path as a UUID.
employeesRouter.get(
  "/account-options",
  requirePermission("employees:manage"),
  async (_req, res) => {
    const records = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(asc(users.name), asc(users.id))
      .limit(100);

    res.json({ data: records });
  },
);

// GET /api/employees/:id
employeesRouter.get(
  "/:id",
  requirePermission("employees:read"),
  async (req, res) => {
    const parsed = uuidParams.safeParse(req.params);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: { code: "VALIDATION_ERROR", message: "Invalid employee ID" },
        });
      return;
    }
    const employee = await getEmployee(parsed.data.id);
    if (!employee) {
      res
        .status(404)
        .json({
          error: { code: "EMPLOYEE_NOT_FOUND", message: "Employee not found" },
        });
      return;
    }
    res.json({ data: employee });
  },
);

// POST /api/employees
employeesRouter.post(
  "/",
  requireTrustedOrigin,
  requirePermission("employees:manage"),
  async (req, res) => {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: { code: "VALIDATION_ERROR", message: "Invalid employee data" },
        });
      return;
    }
    const invalid = await validateReferences(
      parsed.data.departmentId,
      parsed.data.userId,
    );
    if (invalid) {
      res
        .status(invalid.status)
        .json({ error: { code: invalid.code, message: invalid.message } });
      return;
    }
    try {
      const [inserted] = await db
        .insert(employees)
        .values(parsed.data)
        .returning({ id: employees.id });
      const record = await getEmployee(inserted.id);
      res
        .status(201)
        .location(`/api/employees/${inserted.id}`)
        .json({ data: record });
    } catch (error) {
      if (pgErrorCode(error) === "23505") {
        res
          .status(409)
          .json({
            error: {
              code: "EMPLOYEE_CONFLICT",
              message: "Work email or linked user account is already in use",
            },
          });
        return;
      }
      if (pgErrorCode(error) === "23503") {
        res
          .status(409)
          .json({
            error: {
              code: "INVALID_RELATION",
              message: "Department or user account is no longer available",
            },
          });
        return;
      }
      throw error;
    }
  },
);

// PATCH /api/employees/:id
employeesRouter.patch(
  "/:id",
  requireTrustedOrigin,
  requirePermission("employees:manage"),
  async (req, res) => {
    const params = uuidParams.safeParse(req.params);
    const body = updateEmployeeSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid employee update",
          },
        });
      return;
    }
    const invalid = await validateReferences(
      body.data.departmentId,
      body.data.userId,
    );
    if (invalid) {
      res
        .status(invalid.status)
        .json({ error: { code: invalid.code, message: invalid.message } });
      return;
    }
    try {
      const [updated] = await db
        .update(employees)
        .set({ ...body.data, updatedAt: sql`now()` })
        .where(eq(employees.id, params.data.id))
        .returning({ id: employees.id });
      if (!updated) {
        res
          .status(404)
          .json({
            error: {
              code: "EMPLOYEE_NOT_FOUND",
              message: "Employee not found",
            },
          });
        return;
      }
      const record = await getEmployee(updated.id);
      res.json({ data: record });
    } catch (error) {
      if (pgErrorCode(error) === "23505") {
        res
          .status(409)
          .json({
            error: {
              code: "EMPLOYEE_CONFLICT",
              message: "Work email or linked user account is already in use",
            },
          });
        return;
      }
      if (pgErrorCode(error) === "23503") {
        res
          .status(409)
          .json({
            error: {
              code: "INVALID_RELATION",
              message: "Department or user account is no longer available",
            },
          });
        return;
      }
      throw error;
    }
  },
);

// DELETE /api/employees/:id
employeesRouter.delete(
  "/:id",
  requireTrustedOrigin,
  requirePermission("employees:manage"),
  async (req, res) => {
    const parsed = uuidParams.safeParse(req.params);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: { code: "VALIDATION_ERROR", message: "Invalid employee ID" },
        });
      return;
    }
    try {
      const [deleted] = await db
        .delete(employees)
        .where(eq(employees.id, parsed.data.id))
        .returning({ id: employees.id });
      if (!deleted) {
        res
          .status(404)
          .json({
            error: {
              code: "EMPLOYEE_NOT_FOUND",
              message: "Employee not found",
            },
          });
        return;
      }
      res.sendStatus(204);
    } catch (error) {
      if (pgErrorCode(error) === "23503") {
        res
          .status(409)
          .json({
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
