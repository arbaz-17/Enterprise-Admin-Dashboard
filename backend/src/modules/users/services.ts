
import {
  withUserAdministrationTransaction,
  type PublicUser,
} from "./repository.js";

import type { UpdateUserInput } from "./schemas.js";

// ============================================================
// RESULT TYPES
// ============================================================

export type UpdateUserResult =
  | { kind: "self_modification" }
  | { kind: "not_found" }
  | { kind: "last_admin" }
  | {
      kind: "updated";
      user: PublicUser;
    };

// ============================================================
// BUSINESS RULES
// ============================================================

/**
 * Change another user's role or account status.
 *
 * Rules:
 * 1. Administrators cannot modify themselves.
 * 2. At least one active administrator must remain.
 * 3. Deactivating an account revokes its refresh sessions.
 *
 * Last-admin validation and database writes
 * happen within the same transaction.
 */
export async function updateUserAccount(
  actorId: string,
  userId: string,
  updates: UpdateUserInput,
): Promise<UpdateUserResult> {
  // Rule 1: Prevent self-modification.
  if (actorId === userId) {
    return { kind: "self_modification" };
  }

  return withUserAdministrationTransaction<UpdateUserResult>(
    async (repository) => {
      // 1. Fetch current account state.
      const target = await repository.getTargetUser(userId);

      if (!target) {
        return { kind: "not_found" };
      }

      // 2. Calculate the effective account state.
      const nextRole = updates.role ?? target.role;
      const nextActive = updates.isActive ?? target.isActive;

      // 3. Determine whether we're removing
      // an existing active administrator.
      const removingActiveAdmin =
        target.role === "admin" &&
        target.isActive &&
        (nextRole !== "admin" || !nextActive);

      // Rule 2: Never remove the last active admin.
      if (removingActiveAdmin) {
        const hasAnotherAdmin =
          await repository.hasMultipleActiveAdmins();

        if (!hasAnotherAdmin) {
          return { kind: "last_admin" };
        }
      }

      // 4. Apply the account update.
      const updated = await repository.updateTargetUser(
        userId,
        updates,
      );

      if (!updated) {
        return { kind: "not_found" };
      }

      // Rule 3: Revoke sessions on deactivation.
      if (target.isActive && !nextActive) {
        await repository.revokeActiveSessions(userId);
      }

      return {
        kind: "updated",
        user: updated,
      };
    },
  );
}
