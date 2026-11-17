import type { UserRole } from "@/features/auth/auth.types";
import type { ManagedUser, UpdateUserInput } from "./users-api";

export interface PendingUserChange {
  user: ManagedUser;
  payload: UpdateUserInput;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export function getRoleChangeConfirmation(
  user: ManagedUser,
  nextRole: UserRole,
): PendingUserChange {
  return {
    user,
    payload: { role: nextRole },
    title: "Change user role?",
    description:
      `Change ${user.name}'s role from ` +
      `${USER_ROLE_LABELS[user.role]} to ${USER_ROLE_LABELS[nextRole]}? ` +
      "Their permissions will change immediately.",
    confirmLabel: "Change role",
    destructive: user.role === "admin",
  };
}

export function getStatusChangeConfirmation(user: ManagedUser): PendingUserChange {
  const activate = !user.isActive;

  return {
    user,
    payload: { isActive: activate },
    title: activate ? "Activate account?" : "Deactivate account?",
    description: activate
      ? `Activate ${user.name}'s account? ` +
        "They will be able to sign in again."
      : `Deactivate ${user.name}'s account? ` +
        "Their active sessions will be invalidated.",
    confirmLabel: activate ? "Activate account" : "Deactivate account",
    destructive: !activate,
  };
}
