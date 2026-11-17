
import type { ProjectStatus as ProjectDomainStatus } from "@/features/projects/projects.types";

export type ProjectStatus = ProjectDomainStatus;

export interface DashboardMetrics {
  employees: number;
  departments: number;
  clients: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}

export interface MonthlyActivityPoint {
  yearMonth: string;
  month: string;
  created: number;
  completed: number;
}

export interface ProjectStatusCount {
  status: ProjectStatus;
  count: number;
}

export interface DepartmentCount {
  name: string;
  employees: number;
}

export interface RecentProject {
  id: string;
  name: string;
  status: ProjectStatus;
  clientName: string;
  updatedAt: string;
}

export interface RecentProjectsData {
  recentProjects: RecentProject[];
  canViewProjects: boolean;
}

export interface DashboardMetricsResponse {
  data: {
    metrics: DashboardMetrics;
    generatedAt: string;
  };
}

export interface DashboardMonthlyActivityResponse {
  data: {
    monthlyActivity: MonthlyActivityPoint[];
    generatedAt: string;
  };
}

export interface DashboardProjectStatusResponse {
  data: {
    projectStatus: ProjectStatusCount[];
    generatedAt: string;
  };
}

export interface DashboardDepartmentsResponse {
  data: {
    departments: DepartmentCount[];
    generatedAt: string;
  };
}

export interface DashboardRecentProjectsResponse {
  data: RecentProjectsData & {
    generatedAt: string;
  };
}
