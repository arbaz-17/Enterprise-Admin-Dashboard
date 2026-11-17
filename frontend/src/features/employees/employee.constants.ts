import type { EmployeeStatus } from "./employees.types";

export const EMPLOYEE_STATUSES = [
  "active",
  "on_leave",
  "inactive",
] as const satisfies readonly EmployeeStatus[];

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  inactive: "Inactive",
};
