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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

import { useDepartments } from "@/features/departments/departments.queries";
import { EmployeeFormDialog } from "@/features/employees/employee-form-dialog";
import { getEmployeeColumns } from "@/features/employees/employee-columns";
import {
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
} from "@/features/employees/employee.constants";

import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from "@/features/employees/employees.queries";

import type {
  Employee,
  EmployeeInput,
} from "@/features/employees/employees.types";

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
    filterKeys: ["q", "status", "departmentId"] as const,
  });

  const { page, pageSize, sortBy, sortDir, goToPage } = tableState;

  const q = (params.get("q") ?? "").trim().slice(0, 100);

  const statusParam = params.get("status");

  const status = EMPLOYEE_STATUSES.find((value) => value === statusParam);

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
              onSearch={(value) => tableState.setFilter("q", value)}
              hasActiveFilters={Boolean(q || status || departmentId)}
              onClear={tableState.clearFilters}
            >
              {/* Employment status */}
              <Select
                value={status ?? "all"}
                onValueChange={(value) =>
                  tableState.setFilter("status", value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  aria-label="Filter by employment status"
                  className="h-10 w-full sm:w-44"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>

                  {EMPLOYEE_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {EMPLOYEE_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Department */}
              <Select
                value={departmentId ?? "all"}
                onValueChange={(value) =>
                  tableState.setFilter(
                    "departmentId",
                    value === "all" ? "" : value,
                  )
                }
              >
                <SelectTrigger
                  aria-label="Filter by department"
                  className="h-10 w-full sm:w-48"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>

                  {departmentsQuery.data?.data.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
