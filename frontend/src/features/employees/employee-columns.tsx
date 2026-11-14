import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Employee, EmployeeStatus } from "./employees.types";

interface EmployeeColumnOptions {
  canManage: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

function formatDate(value: string | null) {
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

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const labels: Record<EmployeeStatus, string> = {
    active: "Active",
    on_leave: "On leave",
    inactive: "Inactive",
  };

  return (
    <Badge
      variant={
        status === "inactive"
          ? "destructive"
          : status === "on_leave"
            ? "secondary"
            : "outline"
      }
    >
      {labels[status]}
    </Badge>
  );
}

export function getEmployeeColumns({
  canManage,
  onEdit,
  onDelete,
}: EmployeeColumnOptions): ColumnDef<Employee>[] {
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.original;

        return (
          <div className="min-w-40 space-y-1">
            <p className="font-medium">{employee.fullName}</p>

            <p className="text-xs text-muted-foreground">
              {employee.workEmail}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "designation",
      header: "Designation",
    },
    {
      accessorKey: "departmentName",
      header: "Department",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "joiningDate",
      header: "Joined",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.joiningDate)}
        </span>
      ),
    },
    {
      accessorKey: "linkedUserName",
      header: "Linked account",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.linkedUserName ?? "—"}
        </span>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      id: "actions",

      header: () => <div className="text-right">Actions</div>,

      cell: ({ row }) => {
        const employee = row.original;

        return (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${employee.fullName}`}
              onClick={() => onEdit(employee)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              aria-label={`Delete ${employee.fullName}`}
              onClick={() => onDelete(employee)}
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
