
import {
  Building2,
  CheckCircle2,
  FolderKanban,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";

import {
  MonthlyActivityChart,
  ProjectStatusChart,
  DepartmentChart,
} from "@/components/dashboard/dashboard-charts";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { dashboardDemo } from "@/data/dashboard-demo";

const activityIcons = {
  project: FolderKanban,
  employee: UsersRound,
  client: Building2,
};

export function DashboardPage() {
  const { metrics, recentActivity } = dashboardDemo;

  return (
    <div className="space-y-6">
      {/* PAGE HEADING */}
      <PageHeader
        title="Overview"
        description="A sample overview of organization operations, project activity, and team distribution. Live business data is not connected yet."
        actions={
          <Badge variant="outline">
            Demo data
          </Badge>
        }
      />

      {/* KPI CARDS */}
      <section
        aria-label="Key performance indicators"
        className="grid gap-4
                   sm:grid-cols-2
                   xl:grid-cols-4"
      >
        <StatCard
          title="Total employees"
          value={metrics.employees}
          description="Across 5 departments"
          icon={UsersRound}
        />

        <StatCard
          title="Active projects"
          value={metrics.activeProjects}
          description="Currently in progress"
          icon={FolderKanban}
        />

        <StatCard
          title="Total clients"
          value={metrics.clients}
          description="Illustrative client accounts"
          icon={Building2}
        />

        <StatCard
          title="Completed projects"
          value={metrics.completedProjects}
          description="Projects marked complete"
          icon={CheckCircle2}
        />
      </section>

      {/* MAIN CHART ROW */}
      <section
        aria-label="Project analytics"
        className="grid min-w-0 gap-6 xl:grid-cols-5"
      >
        <div className="min-w-0 xl:col-span-3">
          <MonthlyActivityChart />
        </div>

        <div className="min-w-0 xl:col-span-2">
          <ProjectStatusChart />
        </div>
      </section>

      {/* SECONDARY CONTENT ROW */}
      <section
        aria-label="Organization insights"
        className="grid min-w-0 gap-6 xl:grid-cols-5"
      >
        {/* DEPARTMENTS */}
        <div className="min-w-0 xl:col-span-2">
          <DepartmentChart />
        </div>

        {/* RECENT ACTIVITY */}
        <Card className="min-w-0 xl:col-span-3">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">
                Recent activity
              </h2>
            </CardTitle>

            <CardDescription>
              Illustrative workspace events, not live audit logs.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ol className="divide-y divide-border">
              {recentActivity.map((activity) => {
                const Icon = activityIcons[activity.kind];

                return (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3
                               py-4 first:pt-0 last:pb-0"
                  >
                    <div
                      className="flex size-9 shrink-0
                                 items-center justify-center
                                 rounded-lg bg-muted
                                 text-muted-foreground"
                    >
                      <Icon
                        className="size-4"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium leading-5">
                        {activity.title}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>

                    <span
                      className="shrink-0 text-xs
                                 text-muted-foreground"
                    >
                      {activity.date}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
