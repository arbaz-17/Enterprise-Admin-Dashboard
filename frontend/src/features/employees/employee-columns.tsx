import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/formatters/date";

import { EMPLOYEE_STATUS_LABELS } from "./employee.constants";
import type { Employee, EmployeeStatus } from "./employees.types";

interface EmployeeColumnOptions {
  canManage: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
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
      {EMPLOYEE_STATUS_LABELS[status]}
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
          {formatDateOnly(row.original.joiningDate)}
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
