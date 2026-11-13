
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type {
  EmployeeStatus,
  ProjectTeamMember,
} from "./team-assignments.types";

interface TeamMemberColumnOptions {
  canManage: boolean;
  onRemove: (member: ProjectTeamMember) => void;
}

const statusLabels: Record<EmployeeStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  inactive: "Inactive",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getTeamMemberColumns({
  canManage,
  onRemove,
}: TeamMemberColumnOptions): ColumnDef<ProjectTeamMember>[] {
  const columns: ColumnDef<ProjectTeamMember>[] = [
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => {
        const member = row.original;

        return (
          <div className="min-w-48">
            <div className="font-medium">
              {member.fullName}
            </div>

            <div className="text-xs text-muted-foreground">
              {member.workEmail}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => (
        <span className="whitespace-normal">
          {row.original.designation}
        </span>
      ),
    },
    {
      accessorKey: "departmentName",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.departmentName}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <Badge
            variant={
              status === "inactive"
                ? "destructive"
                : "outline"
            }
          >
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignedAt",
      header: "Assigned",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.assignedAt)}
        </span>
      ),
    },
  ];

  // Only admins and authorized project managers
  // receive the remove-member action.
  if (canManage) {
    columns.push({
      id: "actions",

      header: () => (
        <div className="text-right">
          Actions
        </div>
      ),

      cell: ({ row }) => {
        const member = row.original;

        return (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${member.fullName} from project`}
              className="text-destructive hover:text-destructive"
              onClick={() => onRemove(member)}
            >
              <Trash2
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        );
      },
    });
  }

  return columns;
}
