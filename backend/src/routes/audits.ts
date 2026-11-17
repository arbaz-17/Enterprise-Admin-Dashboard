import { Router } from "express";

import { requireAuth } from "../middleware/require-auth.js";
import { requirePermission } from "../middleware/require-permission.js";

import { listAuditLogs, MAX_AUDIT_LOGS } from "../modules/audits/repository.js";

export const auditsRouter = Router();

// All audit endpoints require authentication.
auditsRouter.use(requireAuth);

// ============================================================
// GET /api/audits
// Retrieve recent audit logs (admin only).
// ============================================================

auditsRouter.get("/", requirePermission("audits:read"), async (_req, res) => {
  const { records, hasMore } = await listAuditLogs();

  // Audit activity may contain sensitive information.
  // Do not cache the response in shared or browser caches.
  res.setHeader("Cache-Control", "no-store");

  res.status(200).json({
    data: records,
    meta: {
      returned: records.length,
      limit: MAX_AUDIT_LOGS,
      hasMore,
    },
  });
});
