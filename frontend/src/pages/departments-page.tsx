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

import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

import { DepartmentFormDialog } from "@/features/departments/department-form-dialog";
import { getDepartmentColumns } from "@/features/departments/department-columns";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "@/features/departments/departments.queries";

import type {
  Department,
  DepartmentInput,
} from "@/features/departments/departments.types";

type DepartmentEditor =
  | { mode: "create" }
  | { mode: "edit"; department: Department }
  | null;

export function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("departments:manage");

  const [params, setParams] = useSearchParams();

  const [editor, setEditor] = useState<DepartmentEditor>(null);

  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);

  // Shared URL-based table state
  const tableState = getTableUrlState({
    params,
    setParams,
    sortKeys: ["name", "description", "createdAt"] as const,
    defaultSortBy: "name",
  });

  const { page, pageSize, sortBy, sortDir, goToPage } = tableState;

  const q = (params.get("q") ?? "").trim().slice(0, 100);

  // Server-side data fetching
  const { data, isPending, isError, isFetching, error, refetch } =
    useDepartments({
      page,
      pageSize,
      q: q || undefined,
      sortBy,
      sortDir,
    });

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const total = data?.pagination.total ?? 0;

  // Search preserves sorting and page-size preferences
  function handleSearch(value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }

    next.delete("page");
    setParams(next);
  }

  async function handleSaveDepartment(payload: DepartmentInput): Promise<void> {
    if (!editor || !canManage) {
      throw new Error("You are not authorized to modify departments.");
    }

    if (editor.mode === "create") {
      await createMutation.mutateAsync(payload);

      toast.success("Department created successfully");
    } else {
      await updateMutation.mutateAsync({
        id: editor.department.id,
        payload,
      });

      toast.success("Department updated successfully");
    }

    setEditor(null);
  }

  async function handleDeleteDepartment() {
    if (!deletingDepartment || !canManage || deleteMutation.isPending) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deletingDepartment.id);

      toast.success("Department deleted successfully");

      setDeletingDepartment(null);

      if (data?.data.length === 1 && page > 1) {
        goToPage(page - 1);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // Feature-specific column definitions
  const columns = useMemo(
    () =>
      getDepartmentColumns({
        canManage,

        onEdit: (department) =>
          setEditor({
            mode: "edit",
            department,
          }),

        onDelete: setDeletingDepartment,
      }),
    [canManage],
  );

  // Shared table configuration
  const tableProps = {
    columns,
    page,
    pageSize,
    total,
    sorting: tableState.sorting,
    onSortingChange: tableState.onSortingChange,
    onPageChange: goToPage,
    onPageSizeChange: tableState.onPageSizeChange,
    tableLabel: "Departments",
    getRowId: (department: Department) => department.id,
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Departments"
          description="Browse and manage organizational departments."
          actions={
            canManage ? (
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" />
                Add department
              </Button>
            ) : (
              <Badge variant="outline">Read-only</Badge>
            )
          }
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Department directory</h2>
            </CardTitle>

            <CardDescription>
              {data
                ? `${total} department${total === 1 ? "" : "s"} found`
                : "Search and browse department records"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <DataTableToolbar
              searchValue={q}
              searchLabel="Search departments"
              placeholder="Search departments..."
              onSearch={handleSearch}
              hasActiveFilters={Boolean(q)}
              onClear={() => handleSearch("")}
            />

            {isPending ? (
              <DataTable {...tableProps} data={[]} isLoading />
            ) : isError ? (
              <ErrorState
                title="Unable to load departments"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !data || total === 0 ? (
              <EmptyState
                icon={Building2}
                title={q ? "No matching departments" : "No departments yet"}
                description={
                  q
                    ? "Try a different search term."
                    : "There are no department records available yet."
                }
              />
            ) : data.data.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No departments on this page"
                description="This page is outside the available results."
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
        <DepartmentFormDialog
          key={editor.mode === "edit" ? editor.department.id : "create"}
          department={editor.mode === "edit" ? editor.department : null}
          isPending={createMutation.isPending || updateMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onSave={handleSaveDepartment}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deletingDepartment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingDepartment(null);
          }
        }}
        title="Delete department?"
        description={
          deletingDepartment
            ? `Are you sure you want to delete "${deletingDepartment.name}"? This action cannot be undone. Departments with assigned employees cannot be deleted.`
            : ""
        }
        confirmLabel="Delete department"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => void handleDeleteDepartment()}
      />
    </>
  );
}
