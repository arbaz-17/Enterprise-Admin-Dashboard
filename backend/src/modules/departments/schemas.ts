
import { z } from "zod";

// ============================================================
// COMMON SCHEMAS
// ============================================================

export const idParamsSchema = z.object({
  id: z.uuid(),
});

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer")
  .transform((value) => value || null)
  .nullable();

// ============================================================
// GET /api/departments
// ============================================================

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  q: z.string().trim().max(100).optional(),

  sortBy: z
    .enum(["name", "description", "createdAt"])
    .default("name"),

  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

// ============================================================
// POST /api/departments
// ============================================================

export const createDepartmentSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(100, "Department name must be 100 characters or fewer"),

  description: descriptionSchema.optional(),
});

// ============================================================
// PATCH /api/departments/:id
// ============================================================

export const updateDepartmentSchema = createDepartmentSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update",
  );

// ============================================================
// INFERRED TYPES
// ============================================================

export type DepartmentListQuery = z.infer<
  typeof listQuerySchema
>;

export type CreateDepartmentInput = z.infer<
  typeof createDepartmentSchema
>;

export type UpdateDepartmentInput = z.infer<
  typeof updateDepartmentSchema
>;
