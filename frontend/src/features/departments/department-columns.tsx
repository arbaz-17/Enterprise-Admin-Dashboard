import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Department } from "./departments.types";

interface DepartmentColumnOptions {
  canManage: boolean;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

export function getDepartmentColumns({
  canManage,
  onEdit,
  onDelete,
}: DepartmentColumnOptions): ColumnDef<Department>[] {
  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="block max-w-sm whitespace-normal text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      id: "actions",

      header: () => <div className="text-right">Actions</div>,

      cell: ({ row }) => {
        const department = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${department.name}`}
              onClick={() => onEdit(department)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${department.name}`}
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(department)}
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
