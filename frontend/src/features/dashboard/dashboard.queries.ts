import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboard-api";

export const dashboardKeys = {
  all: ["dashboard"] as const,

  metrics: () => [...dashboardKeys.all, "metrics"] as const,

  monthlyActivity: () => [...dashboardKeys.all, "monthly-activity"] as const,

  projectStatus: () => [...dashboardKeys.all, "project-status"] as const,

  departments: () => [...dashboardKeys.all, "departments"] as const,

  recentProjects: () => [...dashboardKeys.all, "recent-projects"] as const,

  operations: () => [...dashboardKeys.all, "operations"] as const,
};

// Shared behavior for all independent dashboard queries.
const dashboardQueryOptions = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
  retry: 1,
} as const;


export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: ({ signal }) => dashboardApi.metrics(signal),
    ...dashboardQueryOptions,
  });
}

export function useDashboardMonthlyActivity() {
  return useQuery({
    queryKey: dashboardKeys.monthlyActivity(),
    queryFn: ({ signal }) => dashboardApi.monthlyActivity(signal),
    ...dashboardQueryOptions,
  });
}

export function useDashboardProjectStatus() {
  return useQuery({
    queryKey: dashboardKeys.projectStatus(),
    queryFn: ({ signal }) => dashboardApi.projectStatus(signal),
    ...dashboardQueryOptions,
  });
}

export function useDashboardDepartments() {
  return useQuery({
    queryKey: dashboardKeys.departments(),
    queryFn: ({ signal }) => dashboardApi.departments(signal),
    ...dashboardQueryOptions,
  });
}

export function useDashboardRecentProjects() {
  return useQuery({
    queryKey: dashboardKeys.recentProjects(),
    queryFn: ({ signal }) => dashboardApi.recentProjects(signal),
    ...dashboardQueryOptions,
  });
}

export function useDashboardOperations() {
  return useQuery({
    queryKey: dashboardKeys.operations(),
    queryFn: ({ signal }) => dashboardApi.operations(signal),
    ...dashboardQueryOptions,
  });
}
