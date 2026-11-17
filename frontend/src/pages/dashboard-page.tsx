import { lazy } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  FolderKanban,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DashboardWidget } from "@/features/dashboard/dashboard-widget";
import { RecentProjects } from "@/features/dashboard/recent-projects";
import { StatCard } from "@/components/dashboard/stat-card";
import { DeferredChart } from "@/components/dashboard/deferred-chart";
import {
  StatCardSkeleton,
  MonthlyActivitySkeleton,
  ProjectStatusSkeleton,
  DepartmentSkeleton,
  RecentProjectsSkeleton,
} from "@/components/dashboard/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import {
  dashboardKeys,
  useDashboardMetrics,
  useDashboardMonthlyActivity,
  useDashboardProjectStatus,
  useDashboardDepartments,
  useDashboardRecentProjects,
} from "@/features/dashboard/dashboard.queries";

const MonthlyActivityChart = lazy(() =>
  import("@/components/dashboard/dashboard-charts").then((module) => ({
    default: module.MonthlyActivityChart,
  })),
);

const ProjectStatusChart = lazy(() =>
  import("@/components/dashboard/dashboard-charts").then((module) => ({
    default: module.ProjectStatusChart,
  })),
);

const DepartmentChart = lazy(() =>
  import("@/components/dashboard/dashboard-charts").then((module) => ({
    default: module.DepartmentChart,
  })),
);

export function DashboardPage() {
  const queryClient = useQueryClient();

  // All five requests run independently.
  const metricsQuery = useDashboardMetrics();
  const activityQuery = useDashboardMonthlyActivity();
  const statusQuery = useDashboardProjectStatus();
  const departmentsQuery = useDashboardDepartments();
  const recentProjectsQuery = useDashboardRecentProjects();

  const isFetching = [
    metricsQuery,
    activityQuery,
    statusQuery,
    departmentsQuery,
    recentProjectsQuery,
  ].some((query) => query.isFetching);

  const refreshAll = () => {
    // Refetch all active dashboard queries independently.
    // Cached data remains visible during background fetching.
    void queryClient.invalidateQueries({
      queryKey: dashboardKeys.all,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Live organization statistics from the Enterprise Operations database."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={refreshAll}
          >
            <RefreshCw
              className={`size-4 ${
                isFetching ? "animate-spin motion-reduce:animate-none" : ""
              }`}
              aria-hidden="true"
            />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {/* KPI cards */}
      <section
        aria-label="Key performance indicators"
        aria-busy={metricsQuery.isPending}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <DashboardWidget
          title="Key performance indicators"
          description="Organization statistics and project counts."
          query={metricsQuery}
          skeleton={Array.from({ length: 4 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
          errorClassName="sm:col-span-2 xl:col-span-4"
          warningClassName="sm:col-span-2 xl:col-span-4"
          render={({ data: { metrics } }) => (
            <>
              <StatCard
                title="Total employees"
                value={metrics.employees}
                description={`Across ${metrics.departments} departments`}
                icon={UsersRound}
              />
              <StatCard
                title="Active projects"
                value={metrics.activeProjects}
                description={`Of ${metrics.totalProjects} total projects`}
                icon={FolderKanban}
              />
              <StatCard
                title="Total clients"
                value={metrics.clients}
                description="Active and inactive client accounts"
                icon={Building2}
              />
              <StatCard
                title="Completed projects"
                value={metrics.completedProjects}
                description="Projects currently marked complete"
                icon={CheckCircle2}
              />
            </>
          )}
        />
      </section>

      {/* Project analytics */}
      <section
        aria-label="Project analytics"
        className="grid min-w-0 gap-6 xl:grid-cols-5"
      >
        <div
          className="min-w-0 xl:col-span-3"
          aria-busy={activityQuery.isPending}
        >
          <DashboardWidget
            title="Monthly project activity"
            description="Projects created and completed over the past six months."
            query={activityQuery}
            skeleton={<MonthlyActivitySkeleton />}
            render={({ data }) => (
              <DeferredChart fallback={<MonthlyActivitySkeleton />}>
                <MonthlyActivityChart data={data.monthlyActivity} />
              </DeferredChart>
            )}
          />
        </div>

        <div
          className="min-w-0 xl:col-span-2"
          aria-busy={statusQuery.isPending}
        >
          <DashboardWidget
            title="Project status"
            description="Distribution of projects by current status."
            query={statusQuery}
            skeleton={<ProjectStatusSkeleton />}
            render={({ data }) => (
              <DeferredChart fallback={<ProjectStatusSkeleton />}>
                <ProjectStatusChart data={data.projectStatus} />
              </DeferredChart>
            )}
          />
        </div>
      </section>

      {/* Organization analytics */}
      <section
        aria-label="Organization insights"
        className="grid min-w-0 gap-6 xl:grid-cols-5"
      >
        <div
          className="min-w-0 xl:col-span-2"
          aria-busy={departmentsQuery.isPending}
        >
          <DashboardWidget
            title="Employees by department"
            description="Current employee distribution across departments."
            query={departmentsQuery}
            skeleton={<DepartmentSkeleton />}
            render={({ data }) => (
              <DeferredChart fallback={<DepartmentSkeleton />}>
                <DepartmentChart data={data.departments} />
              </DeferredChart>
            )}
          />
        </div>

        <div
          className="min-w-0 xl:col-span-3"
          aria-busy={recentProjectsQuery.isPending}
        >
          <DashboardWidget
            title="Recently updated projects"
            description="Latest project records by update time. This is not an audit log."
            query={recentProjectsQuery}
            skeleton={<RecentProjectsSkeleton />}
            render={({ data }) => (
              <RecentProjects
                recentProjects={data.recentProjects}
                canViewProjects={data.canViewProjects}
              />
            )}
          />
        </div>
      </section>
    </div>
  );
}
