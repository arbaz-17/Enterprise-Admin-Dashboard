
import { z } from "zod";

// POST /api/auth/login
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(),

  password: z
    .string()
    .min(1)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password exceeds bcrypt input limit",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
