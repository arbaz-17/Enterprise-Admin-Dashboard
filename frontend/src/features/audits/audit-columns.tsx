
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { formatLocalDateTime } from "@/lib/formatters/date";
import { formatEnumLabel } from "@/lib/formatters/text";

import type { AuditLog } from "./audits.types";

export const auditColumns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "occurredAt",
    header: "Date & time",

    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatLocalDateTime(row.original.occurredAt)}
      </span>
    ),
  },

  {
    accessorKey: "actorName",
    header: "Actor",

    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.actorName}
      </span>
    ),
  },

  {
    accessorKey: "action",
    header: "Action",

    cell: ({ row }) =>
      formatEnumLabel(row.original.action),
  },

  {
    accessorKey: "resourceType",
    header: "Resource",

    cell: ({ row }) => (
      <div className="min-w-36 space-y-0.5">
        <p className="font-medium">
          {formatEnumLabel(row.original.resourceType)}
        </p>

        {row.original.resourceName && (
          <p className="text-xs text-muted-foreground">
            {row.original.resourceName}
          </p>
        )}
      </div>
    ),
  },


  {
    accessorKey: "description",
    header: "Activity details",

    cell: ({ row }) => (
      <p className="min-w-60 max-w-md whitespace-normal break-words leading-5">
        {row.original.description}
      </p>
    ),
  },

  {
    accessorKey: "outcome",
    header: "Outcome",

    cell: ({ row }) => (
      <Badge
        variant={
          row.original.outcome === "failure"
            ? "destructive"
            : "outline"
        }
      >
        {row.original.outcome === "failure"
          ? "Failed"
          : "Success"}
      </Badge>
    ),
  },
];
