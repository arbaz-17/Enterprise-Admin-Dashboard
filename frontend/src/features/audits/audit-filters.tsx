import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar";
import { formatEnumLabel } from "@/lib/formatters/text";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  type AuditAction,
  type AuditOutcome,
  type AuditResourceType,
} from "./audits.types";

import {
  EMPTY_AUDIT_FILTERS,
  hasAuditFilters,
  type AuditFilters,
} from "./audits.filters";

interface AuditFiltersControlProps {
  filters: AuditFilters;
  onChange: (next: AuditFilters) => void;
}

export function AuditFiltersControl({
  filters,
  onChange,
}: AuditFiltersControlProps) {
  return (
    <DataTableToolbar
      searchValue={filters.search}
      onSearch={(value) => onChange({ ...filters, search: value })}
      searchLabel="Search audit logs"
      placeholder="Actor, resource, description..."
      hasActiveFilters={hasAuditFilters(filters)}
      onClear={() => onChange({ ...EMPTY_AUDIT_FILTERS })}
    >
      {/* Outcome filter */}
      <select
        aria-label="Filter audit outcome"
        value={filters.outcome}
        onChange={(event) =>
          onChange({
            ...filters,
            outcome: event.target.value as AuditOutcome | "",
          })
        }
        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <option value="">All outcomes</option>
        <option value="success">Success</option>
        <option value="failure">Failure</option>
      </select>

      {/* Action filter */}
      <select
        aria-label="Filter audit action"
        value={filters.action}
        onChange={(event) =>
          onChange({
            ...filters,
            action: event.target.value as AuditAction | "",
          })
        }
        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <option value="">All actions</option>

        {AUDIT_ACTIONS.map((value) => (
          <option key={value} value={value}>
            {formatEnumLabel(value)}
          </option>
        ))}
      </select>

      {/* Resource filter */}
      <select
        aria-label="Filter resource type"
        value={filters.resourceType}
        onChange={(event) =>
          onChange({
            ...filters,
            resourceType: event.target.value as AuditResourceType | "",
          })
        }
        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <option value="">All resources</option>

        {AUDIT_RESOURCE_TYPES.map((value) => (
          <option key={value} value={value}>
            {formatEnumLabel(value)}
          </option>
        ))}
      </select>
    </DataTableToolbar>
  );
}
