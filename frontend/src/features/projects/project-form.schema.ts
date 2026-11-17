import { z } from "zod";
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "./project.constants";
import type { ProjectStatus } from "./projects.types";

const COMPLETED_PROGRESS_MESSAGE = "Completed projects must have 100% progress";

function isCompletionValid(value: { status: ProjectStatus; progress: number }) {
  return value.status !== "completed" || value.progress === 100;
}

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(160),
    description: z.string().trim().max(2000, "Maximum 2,000 characters"),
    clientId: z.uuid("Choose a client"),
    managerEmployeeId: z.string().nullable(),
    status: z.enum(PROJECT_STATUSES),
    priority: z.enum(PROJECT_PRIORITIES),
    progress: z.number().int().min(0, "Minimum 0").max(100, "Maximum 100"),
    startDate: z
      .string()
      .refine(
        (value) => !value || z.iso.date().safeParse(value).success,
        "Invalid start date",
      ),
    dueDate: z
      .string()
      .refine(
        (value) => !value || z.iso.date().safeParse(value).success,
        "Invalid due date",
      ),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.dueDate && value.dueDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date must not precede the start date",
      });
    }
    if (!isCompletionValid(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["progress"],
        message: COMPLETED_PROGRESS_MESSAGE,
      });
    }
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

/** Narrow schema for the manager's status/progress dialog. */
export const projectProgressSchema = z
  .object({
    status: z.enum(PROJECT_STATUSES),
    progress: z.number().int().min(0).max(100),
  })
  .refine(isCompletionValid, {
    path: ["progress"],
    message: COMPLETED_PROGRESS_MESSAGE,
  });

export type ProjectProgressFormValues = z.infer<typeof projectProgressSchema>;
