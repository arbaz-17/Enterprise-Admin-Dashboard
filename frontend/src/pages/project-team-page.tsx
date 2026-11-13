import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuth } from "@/hooks/use-auth";

import { AddProjectMemberDialog } from "@/features/team-assignments/add-project-member-dialog";
import { getTeamMemberColumns } from "@/features/team-assignments/team-member-columns";

import {
  useAddTeamMember,
  useProjectTeam,
  useRemoveTeamMember,
} from "@/features/team-assignments/team-assignment.queries";

import type { ProjectTeamMember } from "@/features/team-assignments/team-assignments.types";

import { getApiErrorMessage } from "@/lib/api-error";

export function ProjectTeamPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();

  const { hasPermission } = useAuth();

  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<ProjectTeamMember | null>(null);

  // Existing API query and mutations
  const { data, isPending, isError, isFetching, error, refetch } =
    useProjectTeam(projectId);

  const add = useAddTeamMember();
  const remove = useRemoveTeamMember();

  // Role permission + project-level permission
  const canManage =
    hasPermission("assignments:manage") && Boolean(data?.project.canManageTeam);

  // Feature-specific column definitions
  const columns = useMemo(
    () =>
      getTeamMemberColumns({
        canManage,
        onRemove: setRemoving,
      }),
    [canManage],
  );

  async function handleAdd(employeeId: string) {
    if (!canManage) {
      throw new Error("You do not have permission to manage this team");
    }

    await add.mutateAsync({
      projectId,
      employeeId,
    });

    toast.success("Employee assigned to project");
    setAddOpen(false);
  }

  async function handleRemove() {
    if (!canManage || !removing || remove.isPending) {
      return;
    }

    try {
      await remove.mutateAsync({
        projectId,
        employeeId: removing.employeeId,
      });

      toast.success("Employee removed from project team");

      setRemoving(null);
    } catch (reason) {
      toast.error(getApiErrorMessage(reason));
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={data ? `${data.project.name} — Team` : "Project team"}
          description={
            data
              ? `View team assignments for ${data.project.clientName}. The project manager is assigned separately from team membership.`
              : "View and manage employee assignments for this project."
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/projects">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to Projects
                </Link>
              </Button>

              {canManage && (
                <Button type="button" onClick={() => setAddOpen(true)}>
                  <Plus aria-hidden="true" />
                  Add member
                </Button>
              )}
            </div>
          }
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Team members</h2>
            </CardTitle>

            <CardDescription>
              {data
                ? `${data.data.length} employee${
                    data.data.length === 1 ? "" : "s"
                  } assigned to this project`
                : "Employees currently assigned to this project"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isPending ? (
              <LoadingState message="Loading project team..." />
            ) : isError ? (
              <ErrorState
                title="Unable to load project team"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !data || data.data.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                title="No team members yet"
                description="This project has no assigned employees. Assign active employees to form its team."
                action={
                  canManage ? (
                    <Button type="button" onClick={() => setAddOpen(true)}>
                      <Plus aria-hidden="true" />
                      Add first member
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <DataTable
                columns={columns}
                data={data.data}
                tableLabel="Project team members"
                getRowId={(member) => member.id}
                isFetching={isFetching}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add employee to team */}
      {canManage && addOpen && (
        <AddProjectMemberDialog
          projectId={projectId}
          open={addOpen}
          onOpenChange={setAddOpen}
          isPending={add.isPending}
          onAdd={handleAdd}
        />
      )}

      {/* Remove employee confirmation */}
      <ConfirmDialog
        open={canManage && removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
          }
        }}
        title="Remove team member?"
        description={
          removing
            ? `Remove ${removing.fullName} from this project's team? Their employee profile will not be deleted.`
            : ""
        }
        confirmLabel="Remove member"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => void handleRemove()}
      />
    </>
  );
}
