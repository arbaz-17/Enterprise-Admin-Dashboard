import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { FolderKanban, Plus } from "lucide-react";
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

import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { ProjectProgressDialog } from "@/features/projects/project-progress-dialog";

import {
  getProjectColumns,
  statusLabels,
} from "@/features/projects/project-columns";

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

  // Shared URL-based pagination and sorting
  const tableState = getTableUrlState({
    params,
    setParams,
    sortKeys: [
      "name",
      "clientName",
      "managerName",
      "status",
      "priority",
      "progress",
      "dueDate",
    ] as const,
    defaultSortBy: "name",
  });

  const { page, pageSize, sortBy, sortDir, goToPage } = tableState;

  const q = (params.get("q") ?? "").trim().slice(0, 100);

  const status = STATUSES.find((value) => value === params.get("status"));

  const priority = PRIORITIES.find((value) => value === params.get("priority"));

  // Server-side data
  const { data, isPending, isError, isFetching, error, refetch } = useProjects({
    page,
    pageSize,
    q: q || undefined,
    status,
    priority,
    sortBy,
    sortDir,
  });

  const create = useCreateProject();
  const update = useUpdateProject();
  const remove = useDeleteProject();

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

    for (const key of ["q", "status", "priority", "page"]) {
      next.delete(key);
    }

    setParams(next);
  }

  // Admin: Full project CRUD
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

  // Manager: Assigned project status and progress
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

  // Feature-specific column configuration
  const columns = useMemo(
    () =>
      getProjectColumns({
        canManage,
        canDelete,

        onEdit: (project) =>
          setEditor({
            mode: "edit",
            project,
          }),

        onDelete: setDeleting,
      }),
    [canManage, canDelete],
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
    tableLabel: "Projects",
    getRowId: (project: Project) => project.id,
  };

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
            <DataTableToolbar
              searchValue={q}
              searchLabel="Search projects"
              placeholder="Project or client name..."
              onSearch={(value) => setFilter("q", value)}
              hasActiveFilters={Boolean(q || status || priority)}
              onClear={clearFilters}
            >
              {/* Project status */}
              <Select
                value={status ?? "all"}
                onValueChange={(value) =>
                  setFilter("status", value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  aria-label="Filter projects by status"
                  className="h-10 w-44"
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

              {/* Priority */}
              <Select
                value={priority ?? "all"}
                onValueChange={(value) =>
                  setFilter("priority", value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  aria-label="Filter projects by priority"
                  className="h-10 w-44"
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
            </DataTableToolbar>

            {isPending ? (
              <DataTable {...tableProps} data={[]} isLoading />
            ) : isError ? (
              <ErrorState
                title="Unable to load projects"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !data || total === 0 ? (
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
                {...tableProps}
                data={data.data}
                isFetching={isFetching}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin create/edit */}
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

      {/* Manager progress updates */}
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
