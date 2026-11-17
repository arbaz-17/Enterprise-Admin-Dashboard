import { FolderKanban } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLocalDate } from "@/lib/formatters/date";
import { PROJECT_STATUS_LABELS } from "@/features/projects/project.constants";
import type { RecentProjectsData } from "./dashboard.types";

export function RecentProjects({
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
                      {formatLocalDate(project.updatedAt)}
                    </p>
                  </div>

                  <Badge variant="secondary">
                    {PROJECT_STATUS_LABELS[project.status]}
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
