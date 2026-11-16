import type { ReactNode } from "react";
import { useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FolderKanban,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  MonthlyActivityChart,
  ProjectStatusChart,
  DepartmentChart,
} from "@/components/dashboard/dashboard-charts";
import {
  StatCardSkeleton,
  MonthlyActivitySkeleton,
  ProjectStatusSkeleton,
  DepartmentSkeleton,
  RecentProjectsSkeleton,
} from "@/components/dashboard/dashboard-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  dashboardKeys,
  useDashboardMetrics,
  useDashboardMonthlyActivity,
  useDashboardProjectStatus,
  useDashboardDepartments,
  useDashboardRecentProjects,
} from "@/features/dashboard/dashboard.queries";
import type {
  RecentProjectsData,
  ProjectStatus,
} from "@/features/dashboard/dashboard.types";
import { getApiErrorMessage } from "@/lib/api-error";

const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

interface DashboardWidgetProps<TData> {
  title: string;
  description: string;
  query: UseQueryResult<TData, Error>;
  skeleton: ReactNode;
  render: (data: TData) => ReactNode;
  errorClassName?: string;
  warningClassName?: string;
}

/**
 * Each widget manages its own loading, error and success state.
 * Failed background refreshes preserve previously loaded data.
 */
function DashboardWidget<TData>({
  title,
  description,
  query,
  skeleton,
  render,
  errorClassName = "",
  warningClassName = "",
}: DashboardWidgetProps<TData>) {
  const retry = () => void query.refetch();

  if (query.data === undefined) {
    if (query.isPending) {
      return (
        <>
          <span className="sr-only" role="status">
            Loading {title.toLowerCase()}...
          </span>
          {skeleton}
        </>
      );
    }

    return (
      <Card className={`min-w-0 ${errorClassName}`}>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">{title}</h2>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="min-h-60 justify-center">
          <ErrorState
            title={`Unable to load ${title.toLowerCase()}`}
            message={getApiErrorMessage(query.error)}
            onRetry={retry}
            isRetrying={query.isFetching}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {query.isError && (
        <div
          role="status"
          className={`mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm ${warningClassName}`}
        >
          <AlertCircle
            className="size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <p className="font-medium">{title} could not refresh.</p>
            <p className="text-xs text-muted-foreground">
              Showing previously loaded data. {getApiErrorMessage(query.error)}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={retry}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={`size-4 ${
                query.isFetching
                  ? "animate-spin motion-reduce:animate-none"
                  : ""
              }`}
              aria-hidden="true"
            />
            {query.isFetching ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {render(query.data)}
    </>
  );
}

function RecentProjects({
  recentProjects,
  canViewProjects,
}: RecentProjectsData) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Recently updated projects</h2>
        </CardTitle>

        <CardDescription>
          Latest project records by update time. This is not an audit log.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!canViewProjects ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Project details are available only to authorized users.
          </p>
        ) : recentProjects.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No projects have been created yet.
          </p>
        ) : (
          <>
            <ol className="divide-y divide-border">
              {recentProjects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FolderKanban className="size-4" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">
                      {project.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {project.clientName}
                      {" · Updated "}
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>

                  <Badge variant="secondary">
                    {statusLabels[project.status]}
                  </Badge>
                </li>
              ))}
            </ol>

            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/projects">View all projects</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
              <MonthlyActivityChart data={data.monthlyActivity} />
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
              <ProjectStatusChart data={data.projectStatus} />
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
            render={({ data }) => <DepartmentChart data={data.departments} />}
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
