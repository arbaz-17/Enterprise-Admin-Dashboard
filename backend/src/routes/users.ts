import { Router } from "express";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/index.js";
import { users, refreshSessions } from "../db/schema.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

const paramsSchema = z.object({
  id: z.uuid(),
});

const updateUserSchema = z
  .strictObject({
    role: z.enum(["admin", "manager", "viewer"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) => value.role !== undefined || value.isActive !== undefined,
    "Provide a role or account status",
  );

const publicUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
};

// GET /api/users
usersRouter.get("/", requirePermission("users:read"), async (_req, res) => {
  const records = await db
    .select(publicUserFields)
    .from(users)
    .orderBy(asc(users.name), asc(users.id))
    .limit(100);

  res.status(200).json({ users: records });
});

// PATCH /api/users/:id
usersRouter.patch(
  "/:id",
  requireTrustedOrigin,
  requirePermission("users:manage"),
  async (req, res) => {
    const params = paramsSchema.safeParse(req.params);
    const body = updateUserSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user update request",
        },
      });
      return;
    }

    const userId = params.data.id;
    const actorId = req.authUser!.id;

    // Prevent accidentally removing one's own access.
    if (userId === actorId) {
      res.status(409).json({
        error: {
          code: "SELF_MODIFICATION_NOT_ALLOWED",
          message: "You cannot modify your own account",
        },
      });
      return;
    }

    const result = await db.transaction(async (tx) => {
      // Serialize administrative changes so two requests
      // cannot simultaneously remove the last admin.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(271828, 314159)`);

      const [target] = await tx
        .select({
          id: users.id,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!target) {
        return { kind: "not_found" as const };
      }

      const nextRole = body.data.role ?? target.role;
      const nextActive = body.data.isActive ?? target.isActive;

      const removingActiveAdmin =
        target.role === "admin" &&
        target.isActive &&
        (nextRole !== "admin" || !nextActive);

      if (removingActiveAdmin) {
        const activeAdmins = await tx
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.role, "admin"), eq(users.isActive, true)))
          .limit(2);

        if (activeAdmins.length <= 1) {
          return { kind: "last_admin" as const };
        }
      }

      const [updated] = await tx
        .update(users)
        .set({
          ...body.data,
          updatedAt: sql`now()`,
        })
        .where(eq(users.id, userId))
        .returning(publicUserFields);

      // Invalidate outstanding refresh sessions when
      // an account is deactivated.
      if (target.isActive && !nextActive) {
        await tx
          .update(refreshSessions)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshSessions.userId, userId),
              isNull(refreshSessions.revokedAt),
            ),
          );
      }

      return {
        kind: "updated" as const,
        user: updated,
      };
    });

    if (result.kind === "not_found") {
      res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
      return;
    }

    if (result.kind === "last_admin") {
      res.status(409).json({
        error: {
          code: "LAST_ADMIN_REQUIRED",
          message: "At least one active administrator must remain",
        },
      });
      return;
    }

    res.status(200).json({
      data: result.user,
    });
  },
);
