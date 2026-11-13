import { useMemo, useState, type FormEvent } from "react";

import { useSearchParams, Link } from "react-router";

import { Plus, Search, UsersRound, X } from "lucide-react";

import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/hooks/use-auth";
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

import { getApiErrorMessage } from "@/lib/api-error";

const PAGE_SIZE = 10;

const STATUSES: EmployeeStatus[] = ["active", "on_leave", "inactive"];

type Editor = { mode: "create" } | { mode: "edit"; employee: Employee } | null;

export function EmployeesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("employees:manage");

  const [params, setParams] = useSearchParams();

  const [editor, setEditor] = useState<Editor>(null);

  const [deleting, setDeleting] = useState<Employee | null>(null);

  // URL-based pagination and filters
  const rawPage = Number(params.get("page") ?? "1");

  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000
      ? rawPage
      : 1;

  const q = (params.get("q") ?? "").trim().slice(0, 100);

  const statusValue = params.get("status");

  const status = STATUSES.find((value) => value === statusValue);

  const departmentId = params.get("departmentId") || undefined;

  // Server-side data fetching
  const { data, isPending, isError, isFetching, error, refetch } = useEmployees(
    {
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      status,
      departmentId,
    },
  );

  const departmentsQuery = useDepartments({
    page: 1,
    pageSize: 100,
  });

  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();

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

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const term = String(new FormData(event.currentTarget).get("q") ?? "")
      .trim()
      .slice(0, 100);

    updateFilter("q", term);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(params);

    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
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

  // Feature-specific column definitions
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

  const total = data?.pagination.total ?? 0;

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
            {/* Search and filters */}
            <div className="flex flex-wrap items-end gap-2">
              <form
                role="search"
                className="flex min-w-48 flex-1 items-end gap-2 sm:max-w-md"
                onSubmit={handleSearch}
              >
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="employee-search" className="sr-only">
                    Search employees
                  </label>

                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <Input
                    key={q}
                    id="employee-search"
                    type="search"
                    name="q"
                    defaultValue={q}
                    maxLength={100}
                    placeholder="Name, email or designation..."
                    className="h-10 pl-9"
                  />
                </div>

                <Button type="submit">Search</Button>
              </form>

              {/* Employment status filter */}
              <div>
                <label htmlFor="employee-status-filter" className="sr-only">
                  Filter by employment status
                </label>

                <select
                  id="employee-status-filter"
                  value={status ?? ""}
                  onChange={(event) =>
                    updateFilter("status", event.target.value)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Department filter */}
              <div>
                <label htmlFor="employee-department-filter" className="sr-only">
                  Filter by department
                </label>

                <select
                  id="employee-department-filter"
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
              </div>

              {(q || status || departmentId) && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setParams({})}
                >
                  <X aria-hidden="true" className="size-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Table content */}
            {isPending ? (
              <LoadingState message="Loading employees..." />
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
                  <Button variant="outline" onClick={() => goToPage(1)}>
                    First page
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={columns}
                data={data.data}
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={goToPage}
                tableLabel="Employees"
                getRowId={(employee) => employee.id}
                isFetching={isFetching}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/edit dialog */}
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
