import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router";
import { Pencil, Trash2, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project, ProjectStatus } from "./projects.types";

export const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

interface ProjectColumnOptions {
  canManage: boolean;
  canDelete: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00Z`);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge
      variant={
        status === "completed"
          ? "secondary"
          : status === "on_hold"
            ? "destructive"
            : "outline"
      }
    >
      {statusLabels[status]}
    </Badge>
  );
}

export function getProjectColumns({
  canManage,
  canDelete,
  onEdit,
  onDelete,
}: ProjectColumnOptions): ColumnDef<Project>[] {
  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: "Project",
      cell: ({ row }) => {
        const project = row.original;

        return (
          <div className="min-w-44 font-medium">
            <div>{project.name}</div>

            {project.description && (
              <p
                className="mt-1 max-w-[230px] truncate text-xs font-normal text-muted-foreground"
                title={project.description}
              >
                {project.description}
              </p>
            )}

            <Button
              asChild
              variant="link"
              size="sm"
              className="mt-1 h-auto px-0 text-xs"
            >
              <Link
                to={`/projects/${project.id}/team`}
                aria-label={`View team for ${project.name}`}
              >
                <UsersRound className="size-3.5" aria-hidden="true" />
                View team
              </Link>
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => (
        <span className="block min-w-32 text-muted-foreground">
          {row.original.clientName}
        </span>
      ),
    },
    {
      accessorKey: "managerName",
      header: "Manager",
      cell: ({ row }) => (
        <span className="block min-w-32 text-muted-foreground">
          {row.original.managerName || "Unassigned"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.priority}</span>
      ),
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress = row.original.progress;

        return (
          <div className="flex min-w-20 items-center gap-2">
            <div
              className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span className="text-xs tabular-nums">{progress}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
  ];

  // Only render the actions column for authorized roles.
  if (canManage || canDelete) {
    columns.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const project = row.original;
        const canEditProject = canManage && project.canEdit;

        return (
          <div className="flex items-center justify-end gap-1">
            {canEditProject && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${project.name}`}
                onClick={() => onEdit(project)}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
            )}

            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${project.name}`}
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(project)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            )}

            {!canEditProject && !canDelete && (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    });
  }

  return columns;
}
