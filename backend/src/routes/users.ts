import { Router } from "express";

// Middleware
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

// Schemas
import { paramsSchema, updateUserSchema } from "../modules/users/schemas.js";

// Repository
import { listUsers } from "../modules/users/repository.js";

// Services
import { updateUserAccount } from "../modules/users/services.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// ============================================================
// GET /api/users
// List public user information.
// ============================================================

usersRouter.get("/", requirePermission("users:read"), async (_req, res) => {
  const records = await listUsers();

  res.status(200).json({
    users: records,
  });
});

// ============================================================
// PATCH /api/users/:id
// Update another user's role or account status.
// ============================================================

usersRouter.patch(
  "/:id",
  requireTrustedOrigin,
  requirePermission("users:manage"),
  async (req, res) => {
    // 1. Validate the request.
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

    // 2. Execute the administrative operation.
    const result = await updateUserAccount(
      req.authUser!.id,
      params.data.id,
      body.data,
    );

    // 3. Translate business results into HTTP responses.
    switch (result.kind) {
      case "self_modification":
        res.status(409).json({
          error: {
            code: "SELF_MODIFICATION_NOT_ALLOWED",
            message: "You cannot modify your own account",
          },
        });
        return;

      case "not_found":
        res.status(404).json({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
        return;

      case "last_admin":
        res.status(409).json({
          error: {
            code: "LAST_ADMIN_REQUIRED",
            message: "At least one active administrator must remain",
          },
        });
        return;

      case "updated":
        res.status(200).json({
          data: result.user,
        });
        return;
    }
  },
);
