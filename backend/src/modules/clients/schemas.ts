
import { z } from "zod";

// Common schemas
const clientStatusSchema = z.enum(["active", "inactive"]);

export const idParamsSchema = z.object({
  id: z.uuid(),
});

// GET /api/clients
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),

  q: z.string().trim().max(100).optional(),
  status: clientStatusSchema.optional(),

  sortBy: z
    .enum([
      "name",
      "contactName",
      "contactEmail",
      "status",
      "updatedAt",
    ])
    .default("name"),

  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

// Shared client fields
const clientFields = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required")
    .max(160),

  contactName: z.string().trim().max(120).nullable(),

  contactEmail: z.email().max(254).nullable(),

  status: clientStatusSchema,
});

// POST /api/clients
export const createClientSchema = clientFields.extend({
  contactName: clientFields.shape.contactName.optional(),
  contactEmail: clientFields.shape.contactEmail.optional(),
  status: clientStatusSchema.default("active"),
});

// PATCH /api/clients/:id
export const updateClientSchema = clientFields
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update",
  );

// Inferred TypeScript types
export type ClientListQuery = z.infer<
  typeof listQuerySchema
>;

export type CreateClientInput = z.infer<
  typeof createClientSchema
>;

export type UpdateClientInput = z.infer<
  typeof updateClientSchema
>;
