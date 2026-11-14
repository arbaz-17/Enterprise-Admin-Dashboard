import { Router } from "express";
import { z } from "zod";
import { asc, eq, ilike, sql, desc } from "drizzle-orm";

import { db } from "../db/index.js";
import { departments } from "../db/schema.js";

import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

export const departmentsRouter = Router();

// Every department endpoint requires authentication.
departmentsRouter.use(requireAuth);

// Query validation for search and pagination.
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  sortBy: z.enum(["name", "description", "createdAt"]).default("name"),

  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer")
  .transform((value) => value || null)
  .nullable();

const createDepartmentSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(100, "Department name must be 100 characters or fewer"),

  description: descriptionSchema.optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,

  "Provide at least one field to update",
);

const idParamsSchema = z.object({
  id: z.uuid(),
});

/**
 * GET /api/departments
 *
 * Query:
 * ?page=1&pageSize=20&q=engineering
 */
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

    const { page, pageSize, q, sortBy, sortDir } = parsed.data;

    const sortColumns = {
      name: departments.name,
      description: departments.description,
      createdAt: departments.createdAt,
    };

    const sortColumn = sortColumns[sortBy];

    const filter = q ? ilike(departments.name, `%${q}%`) : undefined;

    const records = await db
      .select()
      .from(departments)
      .where(filter)
      .orderBy(
        sortDir === "desc" ? desc(sortColumn) : asc(sortColumn),
        asc(departments.id),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = await db.$count(departments, filter);

    res.status(200).json({
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

/**
 * GET /api/departments/:id
 *
 * Fetch one department by UUID.
 */
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

    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, parsed.data.id))
      .limit(1);

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

// POST /api/departments
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
      const [department] = await db
        .insert(departments)
        .values(parsed.data)
        .returning();

      res
        .location(`/api/departments/${department.id}`)
        .status(201)
        .json({ data: department });
    } catch (error) {
      if (getPostgresErrorCode(error) === "23505") {
        res.status(409).json({
          error: {
            code: "DEPARTMENT_ALREADY_EXISTS",
            message: "A department with this name already exists",
          },
        });
        return;
      }

      throw error;
    }
  },
);

// PATCH /api/departments/:id
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
      const [department] = await db
        .update(departments)
        .set({
          ...body.data,
          updatedAt: sql`now()`,
        })
        .where(eq(departments.id, params.data.id))
        .returning();

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
        res.status(409).json({
          error: {
            code: "DEPARTMENT_ALREADY_EXISTS",
            message: "A department with this name already exists",
          },
        });
        return;
      }

      throw error;
    }
  },
);

// DELETE /api/departments/:id
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
      const [deleted] = await db
        .delete(departments)
        .where(eq(departments.id, parsed.data.id))
        .returning({ id: departments.id });

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

function getPostgresErrorCode(error: unknown): string | null {
  let current: unknown = error;

  for (let depth = 0; depth < 3; depth++) {
    if (!current || typeof current !== "object") {
      return null;
    }

    if ("code" in current && typeof current.code === "string") {
      return current.code;
    }

    current = "cause" in current ? current.cause : null;
  }

  return null;
}
