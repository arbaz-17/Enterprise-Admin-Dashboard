import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { FolderKanban, Plus, Search, X } from "lucide-react";
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import {
  getProjectColumns,
  statusLabels,
} from "@/features/projects/project-columns";
import { ProjectProgressDialog } from "@/features/projects/project-progress-dialog";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/features/projects/projects.queries";
import type {
  Project,
  ProjectInput,
  ProjectPriority,
  ProjectStatus,
  ProjectStatusInput,
} from "@/features/projects/projects.types";

const PAGE_SIZE = 10;

const STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "on_hold",
  "completed",
];

const PRIORITIES: ProjectPriority[] = ["low", "medium", "high"];

type Editor = { mode: "create" } | { mode: "edit"; project: Project } | null;

export function ProjectsPage() {
  const { hasPermission, user } = useAuth();

  const canCreate = hasPermission("projects:create");
  const canDelete = hasPermission("projects:delete");
  const canManage = hasPermission("projects:manage");
  const isAdmin = user?.role === "admin";

  const [params, setParams] = useSearchParams();
  const [editor, setEditor] = useState<Editor>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  // URL-based pagination and filtering
  const rawPage = Number(params.get("page") ?? "1");

  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000
      ? rawPage
      : 1;

  const q = (params.get("q") ?? "").trim().slice(0, 100);

  const status = STATUSES.find((item) => item === params.get("status"));

  const priority = PRIORITIES.find((item) => item === params.get("priority"));

  // Data fetching
  const { data, isPending, isError, isFetching, error, refetch } = useProjects({
    page,
    pageSize: PAGE_SIZE,
    q: q || undefined,
    status,
    priority,
  });

  const create = useCreateProject();
  const update = useUpdateProject();
  const remove = useDeleteProject();

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

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const term = String(new FormData(event.currentTarget).get("q") ?? "")
      .trim()
      .slice(0, 100);

    setFilter("q", term);
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

  // Admin: full project management
  async function handleAdminSave(payload: ProjectInput): Promise<void> {
    if (!isAdmin || !editor) {
      throw new Error("Only Admins can manage project details");
    }

    if (editor.mode === "create") {
      await create.mutateAsync(payload);
      toast.success("Project created successfully");
    } else {
      await update.mutateAsync({
        id: editor.project.id,
        payload,
      });

      toast.success("Project updated successfully");
    }

    setEditor(null);
  }

  // Manager: assigned project status and progress only
  async function handleManagerSave(payload: ProjectStatusInput): Promise<void> {
    if (
      !canManage ||
      !editor ||
      editor.mode !== "edit" ||
      !editor.project.canEdit
    ) {
      throw new Error("You can only update projects assigned to you");
    }

    await update.mutateAsync({
      id: editor.project.id,
      payload,
    });

    toast.success("Project progress updated");
    setEditor(null);
  }

  async function handleDelete() {
    if (!canDelete || !deleting || remove.isPending) {
      return;
    }

    try {
      await remove.mutateAsync(deleting.id);

      toast.success("Project deleted successfully");
      setDeleting(null);

      if (data?.data.length === 1 && page > 1) {
        goToPage(page - 1);
      }
    } catch (cause) {
      toast.error(getApiErrorMessage(cause));
    }
  }

  const total = data?.pagination.total ?? 0;

  // Feature-specific columns; reusable table rendering.
  const columns = useMemo(
    () =>
      getProjectColumns({
        canManage,
        canDelete,
        onEdit: (project) => setEditor({ mode: "edit", project }),
        onDelete: setDeleting,
      }),
    [canManage, canDelete],
  );

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          description="Track software projects, associated clients, responsible managers, and progress."
          actions={
            canCreate ? (
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" />
                Add project
              </Button>
            ) : (
              <Badge variant="outline">
                {canManage ? "Manage assigned projects" : "Read-only"}
              </Badge>
            )
          }
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Project directory</h2>
            </CardTitle>

            <CardDescription>
              {data
                ? `${total} project${total === 1 ? "" : "s"} found`
                : "Browse company projects"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Search and filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <form
                role="search"
                className="flex min-w-0 flex-1 items-end gap-2"
                onSubmit={handleSearch}
              >
                <div className="relative min-w-0 flex-1 sm:max-w-sm">
                  <label htmlFor="project-search" className="sr-only">
                    Search project or client
                  </label>

                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <Input
                    key={q}
                    id="project-search"
                    name="q"
                    type="search"
                    maxLength={100}
                    defaultValue={q}
                    placeholder="Project or client name..."
                    className="h-10 pl-9"
                  />
                </div>

                <Button type="submit">Search</Button>

                {q && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Clear search"
                    onClick={() => setFilter("q", "")}
                  >
                    <X aria-hidden="true" />
                  </Button>
                )}
              </form>

              {/* Status filter */}
              <div className="w-full sm:w-44">
                <label className="sr-only" htmlFor="project-status-filter">
                  Filter projects by status
                </label>

                <Select
                  value={status ?? "all"}
                  onValueChange={(value) =>
                    setFilter("status", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger
                    id="project-status-filter"
                    className="h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>

                    {STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {statusLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority filter */}
              <div className="w-full sm:w-44">
                <label className="sr-only" htmlFor="project-priority-filter">
                  Filter projects by priority
                </label>

                <Select
                  value={priority ?? "all"}
                  onValueChange={(value) =>
                    setFilter("priority", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger
                    id="project-priority-filter"
                    className="h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>

                    {PRIORITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value[0].toUpperCase() + value.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table content */}
            {isPending ? (
              <LoadingState message="Loading projects..." />
            ) : isError ? (
              <ErrorState
                title="Unable to load projects"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : data.pagination.total === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title={
                  q || status || priority
                    ? "No matching projects"
                    : "No projects yet"
                }
                description={
                  q || status || priority
                    ? "Change the search or filters to see results."
                    : "No projects have been created yet."
                }
              />
            ) : data.data.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects on this page"
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
                columns={columns}
                data={data.data}
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={goToPage}
                tableLabel="Projects"
                getRowId={(project) => project.id}
                isFetching={isFetching}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin create/edit dialog */}
      {editor && isAdmin && (
        <ProjectFormDialog
          key={editor.mode === "create" ? "create" : editor.project.id}
          project={editor.mode === "edit" ? editor.project : null}
          isPending={create.isPending || update.isPending}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onSave={handleAdminSave}
        />
      )}

      {/* Manager status/progress dialog */}
      {editor?.mode === "edit" && !isAdmin && editor.project.canEdit && (
        <ProjectProgressDialog
          key={editor.project.id}
          project={editor.project}
          isPending={update.isPending}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onSave={handleManagerSave}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete project?"
        description={
          deleting
            ? `Delete "${deleting.name}"? This cannot be undone. Projects with team assignments cannot be deleted.`
            : ""
        }
        confirmLabel="Delete project"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
