
import { desc } from "drizzle-orm";

import { db } from "../../db/index.js";
import { auditLogs } from "../../db/schema.js";

// Maximum records loaded for client-side virtualization.
// The frontend will initially display around 320 demo records.
export const MAX_AUDIT_LOGS = 500;

/**
 * Fetch recent audit logs.
 *
 * - Read-only database operation.
 * - Newest activity first.
 * - Stable ordering for identical timestamps.
 * - Limited result size to prevent unbounded responses.
 *
 * Fetch one extra row to determine whether more
 * records exist beyond the configured limit.
 */
export async function listAuditLogs() {
  const records = await db
    .select({
      id: auditLogs.id,
      actorUserId: auditLogs.actorUserId,
      actorName: auditLogs.actorName,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      resourceName: auditLogs.resourceName,
      description: auditLogs.description,
      outcome: auditLogs.outcome,
      occurredAt: auditLogs.occurredAt,
    })
    .from(auditLogs)
    .orderBy(
      desc(auditLogs.occurredAt),
      desc(auditLogs.id),
    )
    .limit(MAX_AUDIT_LOGS + 1);

  const hasMore = records.length > MAX_AUDIT_LOGS;

  return {
    records: records.slice(0, MAX_AUDIT_LOGS),
    hasMore,
  };
}
