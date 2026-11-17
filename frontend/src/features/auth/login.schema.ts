import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Password must be 72 UTF-8 bytes or fewer",
    ),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
