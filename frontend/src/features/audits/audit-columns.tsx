
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import type { AuditLog } from "./audits.types";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatAuditLabel(value: string): string {
  const label = value.replaceAll("_", " ");

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : dateTimeFormatter.format(date);
}

export const auditColumns: ColumnDef<AuditLog>[] = [
  // --------------------------------------------------
  // Date and time
  // --------------------------------------------------
  {
    accessorKey: "occurredAt",
    header: "Date & time",

    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatDateTime(row.original.occurredAt)}
      </span>
    ),
  },

  // --------------------------------------------------
  // Actor
  // --------------------------------------------------
  {
    accessorKey: "actorName",
    header: "Actor",

    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.actorName}
      </span>
    ),
  },

  // --------------------------------------------------
  // Action
  // --------------------------------------------------
  {
    accessorKey: "action",
    header: "Action",

    cell: ({ row }) =>
      formatAuditLabel(row.original.action),
  },

  // --------------------------------------------------
  // Resource
  // --------------------------------------------------
  {
    accessorKey: "resourceType",
    header: "Resource",

    cell: ({ row }) => (
      <div className="min-w-36 space-y-0.5">
        <p className="font-medium">
          {formatAuditLabel(row.original.resourceType)}
        </p>

        {row.original.resourceName && (
          <p className="text-xs text-muted-foreground">
            {row.original.resourceName}
          </p>
        )}
      </div>
    ),
  },

  // --------------------------------------------------
  // Activity details
  // --------------------------------------------------
  {
    accessorKey: "description",
    header: "Activity details",

    cell: ({ row }) => (
      <p className="min-w-60 max-w-md whitespace-normal break-words leading-5">
        {row.original.description}
      </p>
    ),
  },

  // --------------------------------------------------
  // Outcome
  // --------------------------------------------------
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
