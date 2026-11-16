
import {
  and,
  asc,
  eq,
  isNull,
  sql,
  ilike,
  or,
} from "drizzle-orm";

import { escapeLike } from "../../lib/search.js";
import type { ListUsersQuery, UpdateUserInput } from "./schemas.js";

import { db } from "../../db/index.js";

import {
  users,
  refreshSessions,
} from "../../db/schema.js";

// ============================================================
// TYPES AND PROJECTIONS
// ============================================================

// Public fields only. Never expose password hashes.
const publicUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
};

export type PublicUser = Pick<
  typeof users.$inferSelect,
  "id" | "name" | "email" | "role" | "isActive"
>;

type TargetUser = Pick<
  typeof users.$inferSelect,
  "id" | "role" | "isActive"
>;

/**
 * Operations available within the same
 * administrative database transaction.
 */
interface UserAdministrationTransaction {
  getTargetUser(
    userId: string,
  ): Promise<TargetUser | undefined>;

  hasMultipleActiveAdmins(): Promise<boolean>;

  updateTargetUser(
    userId: string,
    updates: UpdateUserInput,
  ): Promise<PublicUser | undefined>;

  revokeActiveSessions(userId: string): Promise<void>;
}

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * List public user information.
 *
 * Preserve the existing 100-user limit.
 */

export async function listUsers(query: ListUsersQuery) {
  const { page, pageSize, q } = query;

  const pattern = `%${escapeLike(q)}%`;

  const filter = q
    ? or(
        ilike(users.name, pattern),
        ilike(users.email, pattern),
      )
    : undefined;

  // Keep reads sequential for the existing DB pool.
  const records = await db
    .select(publicUserFields)
    .from(users)
    .where(filter)
    .orderBy(asc(users.name), asc(users.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = await db.$count(users, filter);

  return { records, total };
}

// ============================================================
// ADMINISTRATIVE TRANSACTION
// ============================================================

/**
 * Execute user administration operations within
 * one PostgreSQL transaction.
 *
 * The advisory transaction lock serializes
 * administrative changes that use this lock.
 *
 * This preserves the existing last-admin protection.
 */
export async function withUserAdministrationTransaction<T>(
  operation: (
    repository: UserAdministrationTransaction,
  ) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // Preserve the existing advisory lock.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(271828, 314159)`,
    );

    const repository: UserAdministrationTransaction = {
      /**
       * Retrieve the target account's current
       * role and status.
       */
      async getTargetUser(userId) {
        const [target] = await tx
          .select({
            id: users.id,
            role: users.role,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        return target;
      },

      /**
       * Determine whether at least two active
       * administrators currently exist.
       *
       * Limit to two rows because we only need
       * to distinguish one from multiple.
       */
      async hasMultipleActiveAdmins() {
        const activeAdmins = await tx
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.role, "admin"),
              eq(users.isActive, true),
            ),
          )
          .limit(2);

        return activeAdmins.length > 1;
      },

      /**
       * Update the target user's role or status.
       */
      async updateTargetUser(userId, updates) {
        const [updated] = await tx
          .update(users)
          .set({
            ...updates,
            updatedAt: sql`now()`,
          })
          .where(eq(users.id, userId))
          .returning(publicUserFields);

        return updated;
      },

      /**
       * Revoke all outstanding refresh sessions
       * belonging to the target user.
       */
      async revokeActiveSessions(userId) {
        await tx
          .update(refreshSessions)
          .set({
            revokedAt: new Date(),
          })
          .where(
            and(
              eq(refreshSessions.userId, userId),
              isNull(refreshSessions.revokedAt),
            ),
          );
      },
    };

    return operation(repository);
  });
}
