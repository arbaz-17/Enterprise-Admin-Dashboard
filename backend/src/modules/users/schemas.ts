
import { z } from "zod";

// PATCH /api/users/:id
export const paramsSchema = z.object({
  id: z.uuid(),
});

// Allowed user roles.
const userRoleSchema = z.enum([
  "admin",
  "manager",
  "viewer",
]);

// PATCH /api/users/:id
export const updateUserSchema = z
  .strictObject({
    role: userRoleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.isActive !== undefined,
    "Provide a role or account status",
  );


export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).default(""),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// Inferred TypeScript type.
export type UpdateUserInput = z.infer<
  typeof updateUserSchema
>;
