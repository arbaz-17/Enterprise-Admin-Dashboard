import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar";
import { getTableUrlState } from "@/components/dashboard/table-url-state";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

import { ClientFormDialog } from "@/features/clients/client-form-dialog";
import { getClientColumns } from "@/features/clients/client-columns";

import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from "@/features/clients/clients.queries";

import type {
  Client,
  ClientInput,
  ClientStatus,
} from "@/features/clients/clients.types";

type Editor = { mode: "create" } | { mode: "edit"; client: Client } | null;

export function ClientsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("clients:manage");

  const [params, setParams] = useSearchParams();
  const [editor, setEditor] = useState<Editor>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  // Shared URL-based pagination and sorting
  const tableState = getTableUrlState({
    params,
    setParams,
    sortKeys: [
      "name",
      "contactName",
      "contactEmail",
      "status",
      "updatedAt",
    ] as const,
    defaultSortBy: "name",
  });

  const { page, pageSize, sortBy, sortDir, goToPage } = tableState;

  const q = (params.get("q") ?? "").trim().slice(0, 100);

  const statusParam = params.get("status");

  const status: ClientStatus | undefined =
    statusParam === "active" || statusParam === "inactive"
      ? statusParam
      : undefined;

  // API queries and mutations
  const { data, isPending, isError, isFetching, error, refetch } = useClients({
    page,
    pageSize,
    q: q || undefined,
    status,
    sortBy,
    sortDir,
  });

  const create = useCreateClient();
  const update = useUpdateClient();
  const remove = useDeleteClient();

  const total = data?.pagination.total ?? 0;

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    next.delete("page");
    setParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams(params);

    for (const key of ["q", "status", "page"]) {
      next.delete(key);
    }

    setParams(next);
  }

  async function handleSave(payload: ClientInput): Promise<void> {
    if (!canManage || !editor) {
      throw new Error("Not authorized to manage clients");
    }

    if (editor.mode === "create") {
      await create.mutateAsync(payload);

      toast.success("Client created successfully");
    } else {
      await update.mutateAsync({
        id: editor.client.id,
        payload,
      });

      toast.success("Client updated successfully");
    }

    setEditor(null);
  }

  async function handleDelete() {
    if (!canManage || !deleting || remove.isPending) {
      return;
    }

    try {
      await remove.mutateAsync(deleting.id);

      toast.success("Client deleted successfully");

      setDeleting(null);

      if (data?.data.length === 1 && page > 1) {
        goToPage(page - 1);
      }
    } catch (cause) {
      toast.error(getApiErrorMessage(cause));
    }
  }

  // Feature-specific columns
  const columns = useMemo(
    () =>
      getClientColumns({
        canManage,

        onEdit: (client) =>
          setEditor({
            mode: "edit",
            client,
          }),

        onDelete: setDeleting,
      }),
    [canManage],
  );

  const tableProps = {
    columns,
    page,
    pageSize,
    total,
    sorting: tableState.sorting,
    onSortingChange: tableState.onSortingChange,
    onPageChange: goToPage,
    onPageSizeChange: tableState.onPageSizeChange,
    tableLabel: "Clients",
    getRowId: (client: Client) => client.id,
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Clients"
          description="Manage the client organizations associated with company projects."
          actions={
            canManage ? (
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" />
                Add client
              </Button>
            ) : (
              <Badge variant="outline">Read-only</Badge>
            )
          }
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Client directory</h2>
            </CardTitle>

            <CardDescription>
              {data
                ? `${total} client${total === 1 ? "" : "s"} found`
                : "Search and browse client records"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <DataTableToolbar
              searchValue={q}
              searchLabel="Search clients"
              placeholder="Search clients..."
              onSearch={(value) => setFilter("q", value)}
              hasActiveFilters={Boolean(q || status)}
              onClear={clearFilters}
            >
              <Select
                value={status ?? "all"}
                onValueChange={(value) =>
                  setFilter("status", value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  aria-label="Filter clients by status"
                  className="h-10 w-44"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>

                  <SelectItem value="active">Active</SelectItem>

                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </DataTableToolbar>

            {isPending ? (
              <DataTable {...tableProps} data={[]} isLoading />
            ) : isError ? (
              <ErrorState
                title="Unable to load clients"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !data || total === 0 ? (
              <EmptyState
                icon={Building2}
                title={q || status ? "No matching clients" : "No clients yet"}
                description={
                  q || status
                    ? "Try changing the search term or status filter."
                    : "No client organizations have been added yet."
                }
              />
            ) : data.data.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No clients on this page"
                description="The requested page is beyond the available results."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToPage(1)}
                  >
                    Back to first page
                  </Button>
                }
              />
            ) : (
              <DataTable
                {...tableProps}
                data={data.data}
                isFetching={isFetching}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit */}
      {editor && (
        <ClientFormDialog
          key={editor.mode === "edit" ? editor.client.id : "create"}
          client={editor.mode === "edit" ? editor.client : null}
          isPending={create.isPending || update.isPending}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete client?"
        description={
          deleting
            ? `Delete "${deleting.name}"? This cannot be undone. Clients linked to projects cannot be deleted.`
            : ""
        }
        confirmLabel="Delete client"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
