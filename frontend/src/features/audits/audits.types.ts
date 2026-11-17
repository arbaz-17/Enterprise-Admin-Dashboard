
export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "assign",
  "unassign",
  "login",
  "logout",
  "role_change",
  "status_change",
] as const;

export const AUDIT_RESOURCE_TYPES = [
  "user",
  "department",
  "employee",
  "client",
  "project",
  "project_assignment",
  "authentication",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditResourceType =
  (typeof AUDIT_RESOURCE_TYPES)[number];

export type AuditOutcome = "success" | "failure";

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  actorName: string;

  action: AuditAction;
  resourceType: AuditResourceType;

  resourceId: string | null;
  resourceName: string | null;

  description: string;
  outcome: AuditOutcome;
  occurredAt: string;
}

export interface AuditListResponse {
  data: AuditLog[];

  meta: {
    returned: number;
    limit: number;
    hasMore: boolean;
  };
}
