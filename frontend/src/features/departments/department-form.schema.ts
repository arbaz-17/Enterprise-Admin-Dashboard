import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(100, "Maximum 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Maximum 500 characters"),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
