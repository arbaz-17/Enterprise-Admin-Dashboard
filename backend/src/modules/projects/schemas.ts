
import { z } from "zod";

// Route parameter validation
export const uuidParams = z.object({
  id: z.uuid(),
});

// Reusable project field schemas
const statusSchema = z.enum([
  "planning",
  "active",
  "on_hold",
  "completed",
]);

const prioritySchema = z.enum([
  "low",
  "medium",
  "high",
]);

const optionalDate = z.iso.date().nullable();

// GET /api/projects - query filters
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  clientId: z.uuid().optional(),
  sortBy: z
    .enum([
      "name",
      "clientName",
      "managerName",
      "status",
      "priority",
      "progress",
      "dueDate",
    ])
    .default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

// Base project fields
const projectFields = z.strictObject({
  name: z.string().trim().min(1, "Project name is required").max(160),
  description: z.string().trim().max(2000).nullable(),
  clientId: z.uuid(),
  managerEmployeeId: z.uuid().nullable(),
  status: statusSchema,
  priority: prioritySchema,
  progress: z.number().int().min(0).max(100),
  startDate: optionalDate,
  dueDate: optionalDate,
});

// POST /api/projects - Admin only
export const createProjectSchema = projectFields.extend({
  description: projectFields.shape.description.optional(),
  managerEmployeeId: projectFields.shape.managerEmployeeId.optional(),
  status: statusSchema.default("planning"),
  priority: prioritySchema.default("medium"),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: optionalDate.optional(),
  dueDate: optionalDate.optional(),
});

// PATCH /api/projects/:id - Admin
export const adminUpdateSchema = projectFields.partial().refine(
  (values) => Object.keys(values).length > 0,
  "Provide at least one field to update",
);

// PATCH /api/projects/:id - Manager
export const managerUpdateSchema = z
  .strictObject({
    status: statusSchema.optional(),
    progress: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (values) => Object.keys(values).length > 0,
    "Provide at least one field to update",
  );

// TypeScript type derived from the Zod schema
export type ProjectFields = z.infer<typeof projectFields>;
export type ProjectListQuery = z.infer<typeof listQuerySchema>;
export type CreateProjectInput = z.infer<
  typeof createProjectSchema
>;
