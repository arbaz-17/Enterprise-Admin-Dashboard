import { apiClient } from "@/lib/api-client";

import type {
  DashboardMetricsResponse,
  DashboardMonthlyActivityResponse,
  DashboardProjectStatusResponse,
  DashboardDepartmentsResponse,
  DashboardRecentProjectsResponse,
  DashboardOperationsResponse,
} from "./dashboard.types";

export const dashboardApi = {
  async operations(signal?: AbortSignal): Promise<DashboardOperationsResponse> {
    const { data } = await apiClient.get<DashboardOperationsResponse>(
      "/dashboard/operations",
      { signal },
    );
    return data;
  },


  async metrics(signal?: AbortSignal): Promise<DashboardMetricsResponse> {
    const { data } = await apiClient.get<DashboardMetricsResponse>(
      "/dashboard/metrics",
      { signal },
    );
    return data;
  },

  async monthlyActivity(
    signal?: AbortSignal,
  ): Promise<DashboardMonthlyActivityResponse> {
    const { data } = await apiClient.get<DashboardMonthlyActivityResponse>(
      "/dashboard/monthly-activity",
      { signal },
    );
    return data;
  },

  async projectStatus(
    signal?: AbortSignal,
  ): Promise<DashboardProjectStatusResponse> {
    const { data } = await apiClient.get<DashboardProjectStatusResponse>(
      "/dashboard/project-status",
      { signal },
    );
    return data;
  },

  async departments(
    signal?: AbortSignal,
  ): Promise<DashboardDepartmentsResponse> {
    const { data } = await apiClient.get<DashboardDepartmentsResponse>(
      "/dashboard/departments",
      { signal },
    );
    return data;
  },

  async recentProjects(
    signal?: AbortSignal,
  ): Promise<DashboardRecentProjectsResponse> {
    const { data } = await apiClient.get<DashboardRecentProjectsResponse>(
      "/dashboard/recent-projects",
      { signal },
    );
    return data;
  },
};
