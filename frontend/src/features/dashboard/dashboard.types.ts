export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface DashboardOverview {
  metrics: {
    employees: number;
    departments: number;
    clients: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
  };
  monthlyActivity: Array<{
    yearMonth: string;
    month: string;
    created: number;
    completed: number;
  }>;
  projectStatus: Array<{
    status: ProjectStatus;
    count: number;
  }>;
  departments: Array<{
    name: string;
    employees: number;
  }>;
  recentProjects: Array<{
    id: string;
    name: string;
    status: ProjectStatus;
    clientName: string;
    updatedAt: string;
  }>;
  canViewProjects: boolean;
  generatedAt: string;
}

// Existing combined response (temporary compatibility).
export interface DashboardOverviewResponse {
  data: DashboardOverview;
}

// Independent endpoint responses.
// Pick ensures the data types stay consistent with DashboardOverview.

export interface DashboardMetricsResponse {
  data: Pick<DashboardOverview, "metrics" | "generatedAt">;
}

export interface DashboardMonthlyActivityResponse {
  data: Pick<DashboardOverview, "monthlyActivity" | "generatedAt">;
}

export interface DashboardProjectStatusResponse {
  data: Pick<DashboardOverview, "projectStatus" | "generatedAt">;
}

export interface DashboardDepartmentsResponse {
  data: Pick<DashboardOverview, "departments" | "generatedAt">;
}

export interface DashboardRecentProjectsResponse {
  data: Pick<
    DashboardOverview,
    "recentProjects" | "canViewProjects" | "generatedAt"
  >;
}
