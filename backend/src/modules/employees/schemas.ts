
import { z } from "zod";

export const uuidParams = z.object({
  id: z.uuid(),
});

const statusSchema = z.enum([
  "active",
  "on_leave",
  "inactive",
]);

// GET /api/employees
export const listQuerySchema = z.object({
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

// Common employee fields
const employeeFields = z.strictObject({
  fullName: z.string().trim().min(1).max(120),
  workEmail: z.string().trim().toLowerCase().email().max(254),
  designation: z.string().trim().min(1).max(100),
  departmentId: z.uuid(),
  userId: z.uuid().nullable(),
  status: statusSchema,
  joiningDate: z.iso.date().nullable(),
});

// POST /api/employees
export const createEmployeeSchema = employeeFields.extend({
  userId: z.uuid().nullable().optional(),
  joiningDate: z.iso.date().nullable().optional(),
  status: statusSchema.default("active"),
});

// PATCH /api/employees/:id
export const updateEmployeeSchema = employeeFields
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update",
  );

// Types derived from validated schemas
export type EmployeeListQuery = z.infer<
  typeof listQuerySchema
>;

export type CreateEmployeeInput = z.infer<
  typeof createEmployeeSchema
>;

export type UpdateEmployeeInput = z.infer<
  typeof updateEmployeeSchema
>;
