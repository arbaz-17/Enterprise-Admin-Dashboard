import type { Project, ProjectInput } from "./projects.types";
import type {
  ProjectFormValues,
  ProjectProgressFormValues,
} from "./project-form.schema";

export function getProjectFormDefaults(project?: Project | null): ProjectFormValues {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    clientId: project?.clientId ?? "",
    managerEmployeeId: project?.managerEmployeeId ?? null,
    status: project?.status ?? "planning",
    priority: project?.priority ?? "medium",
    progress: project?.progress ?? 0,
    startDate: project?.startDate ?? "",
    dueDate: project?.dueDate ?? "",
  };
}

export function toProjectInput(values: ProjectFormValues): ProjectInput {
  return {
    ...values,
    description: values.description || null,
    managerEmployeeId: values.managerEmployeeId || null,
    startDate: values.startDate || null,
    dueDate: values.dueDate || null,
  };
}

export function getProjectProgressDefaults(project: Project): ProjectProgressFormValues {
  return { status: project.status, progress: project.progress };
}
