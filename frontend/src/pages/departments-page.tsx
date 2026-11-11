import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { Building2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAuth } from "@/hooks/use-auth";
import { DepartmentFormDialog } from "@/features/departments/department-form-dialog";
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
import { getApiErrorMessage } from "@/lib/api-error";

const PAGE_SIZE = 10;

type DepartmentEditor =
  | { mode: "create" }
  | { mode: "edit"; department: Department }
  | null;

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

export function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("departments:manage");

  const [searchParams, setSearchParams] = useSearchParams();
  const [editor, setEditor] = useState<DepartmentEditor>(null);
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);

  const rawPage = Number(searchParams.get("page") ?? 1);
  const page =
    Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 100000
      ? rawPage
      : 1;
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);

  const { data, isPending, isError, isFetching, error, refetch } =
    useDepartments({ page, pageSize: PAGE_SIZE, q: q || undefined });

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const term = String(formData.get("q") ?? "").trim().slice(0, 100);

    const next = new URLSearchParams();
    if (term) next.set("q", term);
    // New searches start at page one.
    setSearchParams(next);
  }

  function clearSearch() {
    setSearchParams({});
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    setSearchParams(next);
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

      // Avoid leaving the user on an empty final page after deletion.
      if (data?.data.length === 1 && page > 1) {
        goToPage(page - 1);
      }
    } catch (error) {
      // Keep the confirmation dialog open on failure.
      toast.error(getApiErrorMessage(error));
    }
  }

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;
  const start = data?.data.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = data?.data.length ? start + data.data.length - 1 : 0;

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
            <form
              role="search"
              onSubmit={handleSearch}
              className="flex flex-wrap items-end gap-2"
            >
              <div className="min-w-0 flex-1 sm:max-w-sm">
                <label htmlFor="department-search" className="sr-only">
                  Search departments
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    key={q}
                    id="department-search"
                    name="q"
                    type="search"
                    defaultValue={q}
                    maxLength={100}
                    placeholder="Search departments..."
                    className="h-10 pl-9"
                  />
                </div>
              </div>

              <Button type="submit">Search</Button>
              {q && (
                <Button type="button" variant="outline" onClick={clearSearch}>
                  <X className="size-4" aria-hidden="true" />
                  Clear
                </Button>
              )}
            </form>

            {isPending ? (
              <LoadingState message="Loading departments..." />
            ) : isError ? (
              <ErrorState
                title="Unable to load departments"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !data || data.pagination.total === 0 ? (
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
              <div aria-busy={isFetching}>
                <Table aria-label="Departments">
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Department</TableHead>
                      <TableHead scope="col">Description</TableHead>
                      <TableHead scope="col">Created</TableHead>
                      {canManage && (
                        <TableHead scope="col" className="text-right">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((department) => (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">
                          {department.name}
                        </TableCell>
                        <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                          {department.description || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(department.createdAt)}
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${department.name}`}
                                onClick={() =>
                                  setEditor({ mode: "edit", department })
                                }
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${department.name}`}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingDepartment(department)}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {isFetching && (
                  <p role="status" className="mt-2 text-xs text-muted-foreground">
                    Refreshing departments...
                  </p>
                )}
              </div>
            )}

            {data && total > 0 && (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {start > 0 ? `${start}–${end}` : "0"} of {total}
                </p>
                <nav aria-label="Department pages" className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page <= 1 || isFetching}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      <ConfirmDialog
        open={deletingDepartment !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingDepartment(null);
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
