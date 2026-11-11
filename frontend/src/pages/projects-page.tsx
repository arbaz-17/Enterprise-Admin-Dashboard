import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { FolderKanban, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
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

const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge
      variant={
        status === "completed"
          ? "secondary"
          : status === "on_hold"
            ? "destructive"
            : "outline"
      }
    >
      {statusLabels[status]}
    </Badge>
  );
}

export function ProjectsPage() {
  const { hasPermission, user } = useAuth();
  const canCreate = hasPermission("projects:create");
  const canDelete = hasPermission("projects:delete");
  const canManage = hasPermission("projects:manage");
  const isAdmin = user?.role === "admin";

  const [params, setParams] = useSearchParams();
  const [editor, setEditor] = useState<Editor>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const rawPage = Number(params.get("page") ?? "1");
  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000
      ? rawPage
      : 1;
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  const status = STATUSES.find((item) => item === params.get("status"));
  const priority = PRIORITIES.find((item) => item === params.get("priority"));

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
    if (value) next.set(key, value);
    else next.delete(key);
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
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setParams(next);
  }

  async function handleAdminSave(payload: ProjectInput): Promise<void> {
    if (!isAdmin || !editor)
      throw new Error("Only Admins can manage project details");
    if (editor.mode === "create") {
      await create.mutateAsync(payload);
      toast.success("Project created successfully");
    } else {
      await update.mutateAsync({ id: editor.project.id, payload });
      toast.success("Project updated successfully");
    }
    setEditor(null);
  }

  async function handleManagerSave(payload: ProjectStatusInput): Promise<void> {
    if (
      !canManage ||
      !editor ||
      editor.mode !== "edit" ||
      !editor.project.canEdit
    ) {
      throw new Error("You can only update projects assigned to you");
    }
    await update.mutateAsync({ id: editor.project.id, payload });
    toast.success("Project progress updated");
    setEditor(null);
  }

  async function handleDelete() {
    if (!canDelete || !deleting || remove.isPending) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Project deleted successfully");
      setDeleting(null);
      if (data?.data.length === 1 && page > 1) goToPage(page - 1);
    } catch (cause) {
      toast.error(getApiErrorMessage(cause));
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
          title="Projects"
          description="Track software projects, associated clients, responsible managers, and progress."
          actions={
            canCreate ? (
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" /> Add project
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
              <div className="w-full sm:w-44">
                <label className="sr-only" htmlFor="project-status-filter">
                  Filter projects by status
                </label>
                <Select
                  value={status ?? "all"}
                  onValueChange={(v) =>
                    setFilter("status", v === "all" ? "" : v)
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
              <div className="w-full sm:w-44">
                <label className="sr-only" htmlFor="project-priority-filter">
                  Filter projects by priority
                </label>
                <Select
                  value={priority ?? "all"}
                  onValueChange={(v) =>
                    setFilter("priority", v === "all" ? "" : v)
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
              <Table aria-label="Projects">
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due date</TableHead>
                    {(canManage || canDelete) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="min-w-44 font-medium">
                        <div>{project.name}</div>
                        {project.description && (
                          <p
                            className="mt-1 max-w-[230px] truncate text-xs text-muted-foreground"
                            title={project.description}
                          >
                            {project.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="min-w-32 text-muted-foreground">
                        {project.clientName}
                      </TableCell>
                      <TableCell className="min-w-32 text-muted-foreground">
                        {project.managerName || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={project.status} />
                      </TableCell>
                      <TableCell className="capitalize">
                        {project.priority}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-20 items-center gap-2">
                          <div
                            className="h-1.5 w-16 rounded-full bg-muted"
                            aria-hidden="true"
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums">
                            {project.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(project.dueDate)}
                      </TableCell>
                      {(canManage || canDelete) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {project.canEdit && canManage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${project.name}`}
                                onClick={() =>
                                  setEditor({ mode: "edit", project })
                                }
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${project.name}`}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleting(project)}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            )}
                            {!project.canEdit && !canDelete && (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {data && total > 0 && (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {start
                    ? `Showing ${start}–${end} of ${total}`
                    : `Showing 0 of ${total}`}
                </p>
                <nav
                  aria-label="Project pages"
                  className="flex items-center gap-3"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page <= 1 || isFetching}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
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
