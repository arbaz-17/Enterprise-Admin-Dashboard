
import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      onSearch={(value) =>
        onChange({ ...filters, search: value })
      }
      searchLabel="Search audit logs"
      placeholder="Actor, resource, description..."
      hasActiveFilters={hasAuditFilters(filters)}
      onClear={() => onChange({ ...EMPTY_AUDIT_FILTERS })}
    >
      {/* Outcome filter */}
      <Select
        value={filters.outcome || "all"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            outcome:
              value === "all"
                ? ""
                : (value as AuditOutcome),
          })
        }
      >
        <SelectTrigger
          className="h-10 w-full sm:w-40"
          aria-label="Filter audit outcome"
        >
          <SelectValue placeholder="All outcomes" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            All Outcomes
          </SelectItem>

          <SelectItem value="success">
            Success
          </SelectItem>

          <SelectItem value="failure">
            Failure
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Action filter */}
      <Select
        value={filters.action || "all"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            action:
              value === "all"
                ? ""
                : (value as AuditAction),
          })
        }
      >
        <SelectTrigger
          className="h-10 w-full sm:w-44"
          aria-label="Filter audit action"
        >
          <SelectValue placeholder="All actions" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            All Actions
          </SelectItem>

          {AUDIT_ACTIONS.map((value) => (
            <SelectItem key={value} value={value}>
              {formatEnumLabel(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Resource filter */}
      <Select
        value={filters.resourceType || "all"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            resourceType:
              value === "all"
                ? ""
                : (value as AuditResourceType),
          })
        }
      >
        <SelectTrigger
          className="h-10 w-full sm:w-44"
          aria-label="Filter resource type"
        >
          <SelectValue placeholder="All resources" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            All Resources
          </SelectItem>

          {AUDIT_RESOURCE_TYPES.map((value) => (
            <SelectItem key={value} value={value}>
              {formatEnumLabel(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DataTableToolbar>
  );
}
