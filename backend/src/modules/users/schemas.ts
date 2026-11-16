
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

// Inferred TypeScript type.
export type UpdateUserInput = z.infer<
  typeof updateUserSchema
>;
