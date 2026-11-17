import type { Department, DepartmentInput } from "./departments.types";
import type { DepartmentFormValues } from "./department-form.schema";

export function getDepartmentFormDefaults(
  department?: Department | null,
): DepartmentFormValues {
  return {
    name: department?.name ?? "",
    description: department?.description ?? "",
  };
}

export function toDepartmentInput(values: DepartmentFormValues): DepartmentInput {
  return {
    name: values.name,
    description: values.description || null,
  };
}
