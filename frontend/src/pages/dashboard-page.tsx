import {
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
import { LoadingState } from "@/components/shared/loading-state";
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
import { useDashboardOverview } from "@/features/dashboard/dashboard.queries";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ProjectStatus } from "@/features/dashboard/dashboard.types";

const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function DashboardPage() {
  const {
    data: response,
    isPending,
    isError,
    isFetching,
    error,
    refetch,
  } = useDashboardOverview();
  const overview = response?.data;

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Organization performance and activity."
        />
        <LoadingState message="Loading live dashboard data..." />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Organization performance and activity."
        />
        <ErrorState
          title="Unable to load dashboard"
          message={getApiErrorMessage(error)}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  const { metrics } = overview;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Live organization statistics from the Enterprise Operations database."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Live data</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
                aria-hidden="true"
              />
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        }
      />

      <section
        aria-label="Key performance indicators"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
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
      </section>

      <section
        aria-label="Project analytics"
        className="grid min-w-0 gap-6 xl:grid-cols-5"
      >
        <div className="min-w-0 xl:col-span-3">
          <MonthlyActivityChart data={overview.monthlyActivity} />
        </div>
        <div className="min-w-0 xl:col-span-2">
          <ProjectStatusChart data={overview.projectStatus} />
        </div>
      </section>

      <section
        aria-label="Organization insights"
        className="grid min-w-0 gap-6 xl:grid-cols-5"
      >
        <div className="min-w-0 xl:col-span-2">
          <DepartmentChart data={overview.departments} />
        </div>
        <Card className="min-w-0 xl:col-span-3">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">
                Recently updated projects
              </h2>
            </CardTitle>
            <CardDescription>
              Latest project records by update time. This is not an audit log.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!overview.canViewProjects ? (
              <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Project details are available only to authorized users.
              </p>
            ) : overview.recentProjects.length === 0 ? (
              <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                No projects have been created yet.
              </p>
            ) : (
              <>
                <ol className="divide-y divide-border">
                  {overview.recentProjects.map((project) => (
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
                          {project.clientName} · Updated{" "}
                          {formatDate(project.updatedAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {statusLabels[project.status]}
                      </Badge>
                    </li>
                  ))}
                </ol>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-3 self-start"
                >
                  <Link to="/projects">View all projects</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        Dashboard generated {formatDate(overview.generatedAt)}. Refresh to
        request current values.
      </p>
    </div>
  );
}
