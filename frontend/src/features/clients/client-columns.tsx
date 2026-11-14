import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Client } from "./clients.types";

interface ClientColumnOptions {
  canManage: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getClientColumns({
  canManage,
  onEdit,
  onDelete,
}: ClientColumnOptions): ColumnDef<Client>[] {
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Client",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "contactName",
      header: "Contact",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contactName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "contactEmail",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contactEmail || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <Badge variant={status === "active" ? "outline" : "secondary"}>
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const client = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${client.name}`}
              onClick={() => onEdit(client)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              aria-label={`Delete ${client.name}`}
              onClick={() => onDelete(client)}
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
