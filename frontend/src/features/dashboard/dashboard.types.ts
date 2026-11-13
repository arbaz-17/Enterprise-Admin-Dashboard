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

export interface DashboardOverviewResponse {
  data: DashboardOverview;
}
