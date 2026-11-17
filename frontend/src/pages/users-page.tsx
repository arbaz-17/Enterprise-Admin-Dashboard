import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

import { Input } from "@/components/ui/input";
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
import type { UserRole } from "@/features/auth/auth.types";
import type { ManagedUser } from "@/features/users/users-api";
import { useUsers, useUpdateUser } from "@/features/users/users.queries";
import { UserDirectoryTable } from "@/features/users/user-table";
import {
  getRoleChangeConfirmation,
  getStatusChangeConfirmation,
  type PendingUserChange,
} from "@/features/users/users.helpers";

export function UsersPage() {
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const pageSize = 20;

  const [pendingChange, setPendingChange] = useState<PendingUserChange | null>(
    null,
  );

  const {
    data: userData,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useUsers({ page, pageSize, q: search || undefined });

  const users = userData?.users;
  const pagination = userData?.pagination;
  const updateMutation = useUpdateUser();

  function requestRoleChange(target: ManagedUser, nextRole: UserRole) {
    if (target.id === currentUser?.id || nextRole === target.role) return;
    setPendingChange(getRoleChangeConfirmation(target, nextRole));
  }

  function requestStatusChange(target: ManagedUser) {
    if (target.id === currentUser?.id) return;
    setPendingChange(getStatusChangeConfirmation(target));
  }

  async function confirmChange() {
    if (!pendingChange || updateMutation.isPending) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: pendingChange.user.id,
        input: pendingChange.payload,
      });
      toast.success("User account updated successfully");
      setPendingChange(null);
    } catch (mutationError) {
      toast.error("Unable to update user", {
        description: getApiErrorMessage(mutationError),
      });
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Users & Roles"
          description="Manage application access, roles, and account status."
          actions={
            <Badge variant="outline">
              <ShieldCheck aria-hidden="true" />
              Admin only
            </Badge>
          }
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">User directory</h2>
            </CardTitle>

            <CardDescription>
              {pagination
                ? `${pagination.total} account${pagination.total === 1 ? "" : "s"} found`
                : "Review and manage existing login accounts."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form
              role="search"
              className="flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchDraft.trim());
              }}
            >
              <Input
                type="search"
                aria-label="Search users"
                placeholder="Search by name or email..."
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                maxLength={100}
                className="min-w-48 flex-1"
              />

              <Button type="submit" variant="outline">
                Search
              </Button>

              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setSearchDraft("");
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </form>

            {isError && !users ? (
              <ErrorState
                title="Unable to load users"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !isPending && !users?.length ? (
              <EmptyState
                icon={ShieldCheck}
                title="No user accounts"
                description="There are no accounts available."
              />
            ) : (
              <UserDirectoryTable
                users={users}
                currentUserId={currentUser?.id}
                isPending={isPending}
                isFetching={isFetching}
                isUpdating={updateMutation.isPending}
                onRoleChange={requestRoleChange}
                onStatusChange={requestStatusChange}
              />
            )}

            <p className="text-xs leading-5 text-muted-foreground">
              Admins have full access. Managers can manage permitted project
              workflows. Viewers have read-only dashboard access. Your own
              account cannot be modified here.
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingChange(null);
        }}
        title={pendingChange?.title ?? ""}
        description={pendingChange?.description ?? ""}
        confirmLabel={pendingChange?.confirmLabel ?? "Confirm"}
        variant={pendingChange?.destructive ? "destructive" : "default"}
        isPending={updateMutation.isPending}
        onConfirm={() => void confirmChange()}
      />
    </>
  );
}
