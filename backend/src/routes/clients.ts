import { Router } from "express";

// Middleware
import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

// Schemas
import {
  idParamsSchema,
  listQuerySchema,
  createClientSchema,
  updateClientSchema,
} from "../modules/clients/schemas.js";

// Repository
import {
  listClients,
  getClientById,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
} from "../modules/clients/repository.js";

// Shared utilities
import { createPagination } from "../lib/pagination.js";
import { getPostgresErrorCode } from "../lib/postgres-error.js";

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

// ============================================================
// GET /api/clients
// List clients with filtering, search and pagination.
// ============================================================

clientsRouter.get("/", requirePermission("clients:read"), async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid client filters",
      },
    });
    return;
  }

  const { page, pageSize } = parsed.data;

  // Database retrieval.
  const { records, total } = await listClients(parsed.data);

  res.json({
    data: records,
    pagination: createPagination({
      page,
      pageSize,
      total,
    }),
  });
});

// ============================================================
// GET /api/clients/:id
// Fetch a single client.
// ============================================================

clientsRouter.get(
  "/:id",
  requirePermission("clients:read"),
  async (req, res) => {
    const parsed = idParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client ID",
        },
      });
      return;
    }

    const record = await getClientById(parsed.data.id);

    if (!record) {
      res.status(404).json({
        error: {
          code: "CLIENT_NOT_FOUND",
          message: "Client not found",
        },
      });
      return;
    }

    res.json({ data: record });
  },
);

// ============================================================
// POST /api/clients
// Create a client.
// ============================================================

clientsRouter.post(
  "/",
  requireTrustedOrigin,
  requirePermission("clients:manage"),
  async (req, res) => {
    const parsed = createClientSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client data",
        },
      });
      return;
    }

    const created = await createClientRecord(parsed.data);

    res.status(201).location(`/api/clients/${created.id}`).json({
      data: created,
    });
  },
);

// ============================================================
// PATCH /api/clients/:id
// Update an existing client.
// ============================================================

clientsRouter.patch(
  "/:id",
  requireTrustedOrigin,
  requirePermission("clients:manage"),
  async (req, res) => {
    const params = idParamsSchema.safeParse(req.params);
    const body = updateClientSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client update request",
        },
      });
      return;
    }

    const updated = await updateClientRecord(params.data.id, body.data);

    if (!updated) {
      res.status(404).json({
        error: {
          code: "CLIENT_NOT_FOUND",
          message: "Client not found",
        },
      });
      return;
    }

    res.json({ data: updated });
  },
);

// ============================================================
// DELETE /api/clients/:id
// Delete a client.
// ============================================================

clientsRouter.delete(
  "/:id",
  requireTrustedOrigin,
  requirePermission("clients:manage"),
  async (req, res) => {
    const parsed = idParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client ID",
        },
      });
      return;
    }

    try {
      const deleted = await deleteClientRecord(parsed.data.id);

      if (!deleted) {
        res.status(404).json({
          error: {
            code: "CLIENT_NOT_FOUND",
            message: "Client not found",
          },
        });
        return;
      }

      res.sendStatus(204);
    } catch (error) {
      // A client linked to projects cannot be deleted.
      if (getPostgresErrorCode(error) === "23503") {
        res.status(409).json({
          error: {
            code: "CLIENT_IN_USE",
            message:
              "This client has linked projects. Reassign or remove those projects first.",
          },
        });
        return;
      }

      throw error;
    }
  },
);
