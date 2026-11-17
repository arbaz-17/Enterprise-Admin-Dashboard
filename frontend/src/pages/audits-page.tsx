import { useMemo, useState } from "react";

import { ScrollText } from "lucide-react";

import { DataTable } from "@/components/dashboard/data-table";

import { PageHeader } from "@/components/layout/page-header";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";

import { getApiErrorMessage } from "@/lib/api-error";

import { auditColumns } from "@/features/audits/audit-columns";

import { useAuditLogs } from "@/features/audits/audits.queries";

import type { AuditLog } from "@/features/audits/audits.types";
import { AuditFiltersControl } from "@/features/audits/audit-filters";
import {
  EMPTY_AUDIT_FILTERS,
  filterAuditLogs,
  type AuditFilters,
} from "@/features/audits/audits.filters";

// Keep stable references when data hasn't loaded.
const EMPTY_LOGS: AuditLog[] = [];

const getAuditRowId = (log: AuditLog) => log.id;

export function AuditsPage() {
  // --------------------------------------------------
  // Fetch audit records
  // --------------------------------------------------

  const { data, isPending, isError, isFetching, error, refetch } =
    useAuditLogs();

  // --------------------------------------------------
  // Local filter state
  // --------------------------------------------------

  const [filters, setFilters] = useState<AuditFilters>({
    ...EMPTY_AUDIT_FILTERS,
  });

  // Virtualization is enabled by default.
  const [virtualize, setVirtualize] = useState(true);

  const logs = data?.data ?? EMPTY_LOGS;

  // --------------------------------------------------
  // Client-side filtering
  // --------------------------------------------------

  const visibleLogs = useMemo(
    () => filterAuditLogs(logs, filters),
    [logs, filters],
  );

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Explore demonstration activity records and compare virtualized table rendering."
      />

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">Activity history</h2>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">

          <AuditFiltersControl filters={filters} onChange={setFilters} />

          {/* Virtualization comparison controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1">
              <label
                htmlFor="audit-virtualization"
                className="text-sm font-medium"
              >
                Enable row virtualization
              </label>
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
