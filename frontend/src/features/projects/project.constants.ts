import type { ProjectPriority, ProjectStatus } from "./projects.types";

export const PROJECT_STATUSES = [
  "planning",
  "active",
  "on_hold",
  "completed",
] as const satisfies readonly ProjectStatus[];

export const PROJECT_PRIORITIES = [
  "low",
  "medium",
  "high",
] as const satisfies readonly ProjectPriority[];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};
