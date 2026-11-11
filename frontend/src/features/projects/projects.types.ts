export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type ProjectPriority = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  clientName: string;
  managerEmployeeId: string | null;
  managerName: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

export interface ProjectInput {
  name: string;
  description: string | null;
  clientId: string;
  managerEmployeeId: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
}

export interface ProjectStatusInput {
  status: ProjectStatus;
  progress: number;
}

export interface ProjectListParams {
  page: number;
  pageSize: number;
  q?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  clientId?: string;
}

export interface ProjectListResponse {
  data: Project[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectResponse {
  data: Project;
}

export interface ProjectFormOptions {
  clients: { id: string; name: string; status: "active" | "inactive" }[];
  managers: { id: string; name: string; email: string }[];
}
