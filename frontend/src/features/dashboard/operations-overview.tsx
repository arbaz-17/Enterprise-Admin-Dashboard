import {
  AlertTriangle,
  CalendarClock,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateOnly } from "@/lib/formatters/date";

import type {
  AttentionReason,
  OperationsOverview as OperationsOverviewData,
} from "./dashboard.types";

const reasonLabels: Record<AttentionReason, string> = {
  overdue: "Overdue",
  on_hold: "On hold",
  unassigned: "No manager",
  due_soon: "Due soon",
};

function HealthMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

/** Project health only; distribution charts live in their own module. */
export function OperationsOverview({ data }: { data: OperationsOverviewData }) {
  const { health, attentionProjects, canViewProjects } = data;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Project health</h2>
        </CardTitle>
        <CardDescription>
          Deadlines, progress, and projects requiring attention.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <HealthMetric
            icon={AlertTriangle}
            label="Overdue projects"
            value={health.overdue.toLocaleString("en-US")}
            detail="Unfinished and past due date"
          />
          <HealthMetric
            icon={CalendarClock}
            label="Due in 7 days"
            value={health.dueSoon.toLocaleString("en-US")}
            detail="Unfinished, due today or next 6 days"
          />
          <HealthMetric
            icon={Target}
            label="Average progress"
            value={`${health.averageActiveProgress}%`}
            detail={`${health.activeCount} active projects`}
          />
        </div>

        <div className="rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <h3 className="text-sm font-semibold">
              Projects needing attention
            </h3>
            <span className="text-xs text-muted-foreground">Top 5</span>
          </div>

          {!canViewProjects ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Project details are restricted to authorized users.
            </p>
          ) : attentionProjects.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No overdue, on-hold, unassigned, or near-due projects.
            </p>
          ) : (
            <ul className="divide-y">
              {attentionProjects.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {project.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {project.dueDate
                        ? `Due ${formatDateOnly(project.dueDate)}`
                        : "No due date"}
                      {` · ${project.progress}% complete`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      project.reason === "overdue" ? "destructive" : "outline"
                    }
                  >
                    {reasonLabels[project.reason]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          {canViewProjects && (
            <div className="border-t px-4 py-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/projects">View project directory</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OperationsOverviewSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </CardContent>
    </Card>
  );
}
