import { z } from "zod";

export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required")
    .max(160, "Maximum 160 characters"),
  contactName: z.string().trim().max(120, "Maximum 120 characters"),
  contactEmail: z
    .string()
    .trim()
    .max(254, "Maximum 254 characters")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter a valid contact email address",
    ),
  status: z.enum(["active", "inactive"]),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
