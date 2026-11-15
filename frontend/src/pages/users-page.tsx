import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
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
import type { UserRole } from "@/features/auth/auth.types";
import {
  usersApi,
  type ManagedUser,
  type UpdateUserInput,
} from "@/features/users/users-api";

interface PendingChange {
  user: ManagedUser;
  payload: UpdateUserInput;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );

  const {
    data: users,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => usersApi.list(signal),
    staleTime: 30_000,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (change: PendingChange) =>
      usersApi.update(change.user.id, change.payload),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["users"],
      }),
  });

  function requestRoleChange(target: ManagedUser, nextRole: UserRole) {
    if (target.id === currentUser?.id || nextRole === target.role) {
      return;
    }

    setPendingChange({
      user: target,
      payload: { role: nextRole },
      title: "Change user role?",
      description:
        `Change ${target.name}'s role from ` +
        `${roleLabels[target.role]} to ${roleLabels[nextRole]}? ` +
        "Their permissions will change immediately.",
      confirmLabel: "Change role",
      destructive: target.role === "admin",
    });
  }

  function requestStatusChange(target: ManagedUser) {
    if (target.id === currentUser?.id) {
      return;
    }

    const activate = !target.isActive;

    setPendingChange({
      user: target,
      payload: { isActive: activate },
      title: activate ? "Activate account?" : "Deactivate account?",
      description: activate
        ? `Activate ${target.name}'s account? ` +
          "They will be able to sign in again."
        : `Deactivate ${target.name}'s account? ` +
          "Their active sessions will be invalidated.",
      confirmLabel: activate ? "Activate account" : "Deactivate account",
      destructive: !activate,
    });
  }

  async function confirmChange() {
    if (!pendingChange || updateMutation.isPending) {
      return;
    }

    try {
      await updateMutation.mutateAsync(pendingChange);
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
              {users
                ? `${users.length} account${users.length === 1 ? "" : "s"} found`
                : "Review and manage existing login accounts."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isPending ? (
              <LoadingState message="Loading user accounts..." />
            ) : isError ? (
              <ErrorState
                title="Unable to load users"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : !users?.length ? (
              <EmptyState
                icon={ShieldCheck}
                title="No user accounts"
                description="There are no accounts available."
              />
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.map((account) => {
                      const isSelf = account.id === currentUser?.id;

                      return (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div className="min-w-40 space-y-1">
                              <p className="font-medium">
                                {account.name}
                                {isSelf && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (You)
                                  </span>
                                )}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {account.email}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Select
                              value={account.role}
                              disabled={isSelf || updateMutation.isPending}
                              onValueChange={(value) => {
                                if (
                                  value === "admin" ||
                                  value === "manager" ||
                                  value === "viewer"
                                ) {
                                  requestRoleChange(account, value);
                                }
                              }}
                            >
                              <SelectTrigger
                                aria-label={`Role for ${account.name}`}
                                className="w-32"
                              >
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                account.isActive ? "outline" : "destructive"
                              }
                            >
                              {account.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isSelf || updateMutation.isPending}
                              onClick={() => requestStatusChange(account)}
                            >
                              {account.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
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
