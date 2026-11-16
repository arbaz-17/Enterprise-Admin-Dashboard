
import { z } from "zod";

// Project ID from the parent route.
export const projectParamsSchema = z.object({
  projectId: z.uuid(),
});

// Project and employee IDs for removing a member.
export const memberParamsSchema = projectParamsSchema.extend({
  employeeId: z.uuid(),
});

// POST /api/projects/:projectId/assignments
export const addMemberSchema = z.strictObject({
  employeeId: z.uuid(),
});

// GET /api/projects/:projectId/assignments/options
export const optionsQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
});

// Inferred TypeScript types.
export type AddMemberInput = z.infer<
  typeof addMemberSchema
>;

export type AssignmentOptionsQuery = z.infer<
  typeof optionsQuerySchema
>;
