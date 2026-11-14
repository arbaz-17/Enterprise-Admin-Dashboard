import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus, UsersRound } from "lucide-react";
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

import { useDepartments } from "@/features/departments/departments.queries";
import { EmployeeFormDialog } from "@/features/employees/employee-form-dialog";
import { getEmployeeColumns } from "@/features/employees/employee-columns";

import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from "@/features/employees/employees.queries";

import type {
  Employee,
  EmployeeInput,
  EmployeeStatus,
} from "@/features/employees/employees.types";

const STATUSES: EmployeeStatus[] = ["active", "on_leave", "inactive"];

type Editor = { mode: "create" } | { mode: "edit"; employee: Employee } | null;

export function EmployeesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("employees:manage");

  const [params, setParams] = useSearchParams();

  const [editor, setEditor] = useState<Editor>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  // Shared URL-based table state
  const tableState = getTableUrlState({
    params,
    setParams,
    sortKeys: [
      "fullName",
      "designation",
      "departmentName",
      "status",
      "joiningDate",
      "linkedUserName",
    ] as const,
    defaultSortBy: "fullName",
  });

  const { page, pageSize, sortBy, sortDir, goToPage } = tableState;

  const q = (params.get("q") ?? "").trim().slice(0, 100);

  const statusParam = params.get("status");

  const status = STATUSES.find((value) => value === statusParam);

  const departmentId = params.get("departmentId") || undefined;

  // Queries and mutations
  const { data, isPending, isError, isFetching, error, refetch } = useEmployees(
    {
      page,
      pageSize,
      q: q || undefined,
      status,
      departmentId,
      sortBy,
      sortDir,
    },
  );

  const departmentsQuery = useDepartments({
    page: 1,
    pageSize: 100,
  });

  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();

  const total = data?.pagination.total ?? 0;

  // Search and filters preserve sorting preferences.
  function updateFilter(key: string, value: string) {
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

    for (const key of ["q", "status", "departmentId", "page"]) {
      next.delete(key);
    }

    setParams(next);
  }

  async function handleSave(input: EmployeeInput) {
    if (!canManage || !editor) {
      throw new Error("Not authorized to manage employees");
    }

    if (editor.mode === "create") {
      await create.mutateAsync(input);

      toast.success("Employee created successfully");
    } else {
      await update.mutateAsync({
        id: editor.employee.id,
        input,
      });

      toast.success("Employee updated successfully");
    }

    setEditor(null);
  }

  async function handleDelete() {
    if (!canManage || !deleting || remove.isPending) {
      return;
    }

    try {
      await remove.mutateAsync(deleting.id);

      toast.success("Employee deleted successfully");

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
      getEmployeeColumns({
        canManage,

        onEdit: (employee) =>
          setEditor({
            mode: "edit",
            employee,
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
    tableLabel: "Employees",
    getRowId: (employee: Employee) => employee.id,
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Employees"
          description="Manage workforce records, department assignments, and employment status."
          actions={
            canManage ? (
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" />
                Add employee
              </Button>
            ) : (
              <Badge variant="outline">Read-only</Badge>
            )
          }
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Employee directory</h2>
            </CardTitle>

            <CardDescription>
              {data
                ? `${total} employee${total === 1 ? "" : "s"} found`
                : "Search and browse employees"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <DataTableToolbar
              searchValue={q}
              searchLabel="Search employees"
              placeholder="Name, email or designation..."
              onSearch={(value) => updateFilter("q", value)}
              hasActiveFilters={Boolean(q || status || departmentId)}
              onClear={clearFilters}
            >
              {/* Employment status */}
              <select
                aria-label="Filter by employment status"
                value={status ?? ""}
                onChange={(event) => updateFilter("status", event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Department */}
              <select
                aria-label="Filter by department"
                value={departmentId ?? ""}
                onChange={(event) =>
                  updateFilter("departmentId", event.target.value)
                }
                className="h-10 max-w-[200px] rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <option value="">All departments</option>

                {departmentsQuery.data?.data.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </DataTableToolbar>

            {isPending ? (
              <DataTable {...tableProps} data={[]} isLoading />
            ) : isError ? (
              <ErrorState
                title="Unable to load employees"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !data || total === 0 ? (
              <EmptyState
                icon={UsersRound}
                title={
                  q || status || departmentId
                    ? "No matching employees"
                    : "No employees yet"
                }
                description={
                  q || status || departmentId
                    ? "Adjust your filters or search term."
                    : "Create a department first, then add your first employee."
                }
                action={
                  canManage && !q && !status && !departmentId ? (
                    <Button asChild variant="outline">
                      <Link to="/departments">View departments</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : data.data.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                title="No employees on this page"
                description="Return to the first page to see available results."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToPage(1)}
                  >
                    First page
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
        <EmployeeFormDialog
          key={editor.mode === "edit" ? editor.employee.id : "create"}
          employee={editor.mode === "edit" ? editor.employee : null}
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
        title="Delete employee?"
        description={
          deleting
            ? `Delete ${deleting.fullName}? This cannot be undone. Employees linked to projects cannot be deleted until their project relationships are removed.`
            : ""
        }
        confirmLabel="Delete employee"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
