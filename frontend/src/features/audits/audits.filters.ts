import type {
  AuditAction,
  AuditLog,
  AuditOutcome,
  AuditResourceType,
} from "./audits.types";

export interface AuditFilters {
  search: string;
  outcome: AuditOutcome | "";
  action: AuditAction | "";
  resourceType: AuditResourceType | "";
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  search: "",
  outcome: "",
  action: "",
  resourceType: "",
};

export function hasAuditFilters(filters: AuditFilters): boolean {
  return Boolean(
    filters.search || filters.outcome || filters.action || filters.resourceType,
  );
}

export function filterAuditLogs(logs: AuditLog[], filters: AuditFilters): AuditLog[] {
  const term = filters.search.trim().toLowerCase();

  return logs.filter((log) => {
    if (filters.outcome && log.outcome !== filters.outcome) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.resourceType && log.resourceType !== filters.resourceType) return false;
    if (!term) return true;

    return [
      log.actorName,
      log.action,
      log.resourceType,
      log.resourceName ?? "",
      log.description,
      log.outcome,
    ].some((value) => value.toLowerCase().includes(term));
  });
}
