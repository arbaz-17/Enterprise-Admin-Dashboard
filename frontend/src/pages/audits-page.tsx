
import { useMemo, useState } from "react";

import { ScrollText, ShieldCheck } from "lucide-react";

import { DataTable } from "@/components/dashboard/data-table";
import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar";

import { PageHeader } from "@/components/layout/page-header";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";

import { getApiErrorMessage } from "@/lib/api-error";

import {
  auditColumns,
  formatAuditLabel,
} from "@/features/audits/audit-columns";

import { useAuditLogs } from "@/features/audits/audits.queries";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  type AuditAction,
  type AuditLog,
  type AuditOutcome,
  type AuditResourceType,
} from "@/features/audits/audits.types";

// Keep stable references when data hasn't loaded.
const EMPTY_LOGS: AuditLog[] = [];

const getAuditRowId = (log: AuditLog) => log.id;

export function AuditsPage() {
  // --------------------------------------------------
  // Fetch audit records
  // --------------------------------------------------

  const {
    data,
    isPending,
    isError,
    isFetching,
    error,
    refetch,
  } = useAuditLogs();

  // --------------------------------------------------
  // Local filter state
  // --------------------------------------------------

  const [search, setSearch] = useState("");

  const [outcome, setOutcome] =
    useState<AuditOutcome | "">("");

  const [action, setAction] =
    useState<AuditAction | "">("");

  const [resourceType, setResourceType] =
    useState<AuditResourceType | "">("");

  // Virtualization is enabled by default.
  const [virtualize, setVirtualize] = useState(true);

  const logs = data?.data ?? EMPTY_LOGS;

  // --------------------------------------------------
  // Client-side filtering
  // --------------------------------------------------

  const visibleLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (outcome && log.outcome !== outcome) {
        return false;
      }

      if (action && log.action !== action) {
        return false;
      }

      if (
        resourceType &&
        log.resourceType !== resourceType
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        log.actorName,
        log.action,
        log.resourceType,
        log.resourceName ?? "",
        log.description,
        log.outcome,
      ].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [
    logs,
    search,
    outcome,
    action,
    resourceType,
  ]);

  const hasActiveFilters = Boolean(
    search || outcome || action || resourceType,
  );

  // The shared DataTable activates virtualization
  // when there are at least 50 rows.
  const virtualIsActive =
    virtualize && visibleLogs.length >= 50;

  function clearFilters() {
    setSearch("");
    setOutcome("");
    setAction("");
    setResourceType("");
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Explore demonstration activity records and compare virtualized table rendering."
        actions={
          <Badge variant="outline">
            <ShieldCheck aria-hidden="true" />
            Admin only
          </Badge>
        }
      />

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">
              Activity history
            </h2>
          </CardTitle>

          <CardDescription>
            {data
              ? `${visibleLogs.length} of ${logs.length} loaded records displayed`
              : "Loading read-only audit events"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Demo dataset explanation */}
          <p className="text-xs text-muted-foreground">
            Seeded demonstration data; not live user activity.

            {data?.meta.hasMore && (
              <span className="ml-1 font-medium">
                Only the latest {data.meta.returned} records
                were loaded; filters apply to these records
                only.
              </span>
            )}
          </p>

          {/* Search and filters */}
          <DataTableToolbar
            searchValue={search}
            onSearch={setSearch}
            searchLabel="Search audit logs"
            placeholder="Actor, resource, description..."
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          >
            {/* Outcome filter */}
            <select
              aria-label="Filter audit outcome"
              value={outcome}
              onChange={(event) =>
                setOutcome(
                  event.target.value as AuditOutcome | "",
                )
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
              value={action}
              onChange={(event) =>
                setAction(
                  event.target.value as AuditAction | "",
                )
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <option value="">All actions</option>

              {AUDIT_ACTIONS.map((value) => (
                <option key={value} value={value}>
                  {formatAuditLabel(value)}
                </option>
              ))}
            </select>

            {/* Resource filter */}
            <select
              aria-label="Filter resource type"
              value={resourceType}
              onChange={(event) =>
                setResourceType(
                  event.target.value as AuditResourceType | "",
                )
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <option value="">All resources</option>

              {AUDIT_RESOURCE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {formatAuditLabel(value)}
                </option>
              ))}
            </select>
          </DataTableToolbar>

          {/* Virtualization comparison controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1">
              <label
                htmlFor="audit-virtualization"
                className="text-sm font-medium"
              >
                Enable row virtualization
              </label>

              <p className="text-xs text-muted-foreground">
                {virtualIsActive
                  ? "Active: renders visible rows plus overscan."
                  : virtualize
                    ? "Enabled: requires at least 50 matching records."
                    : "Disabled: renders every matching row."}
              </p>
            </div>

            <Switch
              id="audit-virtualization"
              checked={virtualize}
              onCheckedChange={setVirtualize}
              aria-label="Enable row virtualization"
            />
          </div>

          {/* Loading, error and data states */}
          {isPending ? (
            <DataTable
              columns={auditColumns}
              data={EMPTY_LOGS}
              tableLabel="Audit events"
              getRowId={getAuditRowId}
              isLoading
              constrainHeight
            />
          ) : isError && !data ? (
            <ErrorState
              title="Unable to load audit logs"
              message={getApiErrorMessage(error)}
              onRetry={() => void refetch()}
              isRetrying={isFetching}
            />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No audit records"
              description="Seed the database with demonstration events to populate this table."
            />
          ) : (
            <>
              {isError && (
                <ErrorState
                  title="Audit logs could not refresh"
                  message={getApiErrorMessage(error)}
                  onRetry={() => void refetch()}
                  isRetrying={isFetching}
                />
              )}

              <DataTable
                columns={auditColumns}
                data={visibleLogs}
                tableLabel="Audit events"
                getRowId={getAuditRowId}
                isFetching={isFetching}
                emptyMessage="No audit records match your filters."
                virtualize={virtualize}
                constrainHeight
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
