import { z } from "zod";
import { EMPLOYEE_STATUSES } from "./employee.constants";

export const employeeFormSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(120),
  workEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(254),
  designation: z.string().trim().min(1, "Designation is required").max(100),
  departmentId: z.string().uuid("Select a department"),
  status: z.enum(EMPLOYEE_STATUSES),
  userId: z.string().nullable(),
  joiningDate: z
    .string()
    .refine(
      (date) => !date || z.iso.date().safeParse(date).success,
      "Enter a valid joining date",
    ),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
