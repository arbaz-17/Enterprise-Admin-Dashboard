import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUtcDate } from "@/lib/formatters/date";
import { EMPLOYEE_STATUS_LABELS } from "@/features/employees/employee.constants";

import type { ProjectTeamMember } from "./team-assignments.types";

interface TeamMemberColumnOptions {
  canManage: boolean;
  onRemove: (member: ProjectTeamMember) => void;
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
            <div className="font-medium">{member.fullName}</div>

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
        <span className="whitespace-normal">{row.original.designation}</span>
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
          <Badge variant={status === "inactive" ? "destructive" : "outline"}>
            {EMPLOYEE_STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignedAt",
      header: "Assigned",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatUtcDate(row.original.assignedAt)}
        </span>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      id: "actions",

      header: () => <div className="text-right">Actions</div>,

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
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        );
      },
    });
  }

  return columns;
}
