import type { Employee, EmployeeInput } from "./employees.types";
import type { EmployeeFormValues } from "./employee-form.schema";

export function getEmployeeFormDefaults(
  employee?: Employee | null,
): EmployeeFormValues {
  return {
    fullName: employee?.fullName ?? "",
    workEmail: employee?.workEmail ?? "",
    designation: employee?.designation ?? "",
    departmentId: employee?.departmentId ?? "",
    userId: employee?.userId ?? null,
    status: employee?.status ?? "active",
    joiningDate: employee?.joiningDate ?? "",
  };
}

export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    ...values,
    userId: values.userId || null,
    joiningDate: values.joiningDate || null,
  };
}
