# Audits

## Overview

Read-only audit activity for the `/audits` page, including recorded actions, actors, resources, outcomes, and timestamps.

## Key Responsibilities

- Fetch audit records from `GET /audits` through TanStack Query.
- Display formatted activity details and success/failure outcomes.
- Filter the **returned records on the client** by search text, outcome, action, and resource type.

## Structure

| File | Purpose |
| --- | --- |
| `audits-api.ts` | Fetches audit logs using the shared API client. |
| `audits.queries.ts` | `useAuditLogs()` query and audit cache keys. |
| `audits.types.ts` | Audit record/response types and allowed actions/resources. |
| `audits.filters.ts` | Filter state, defaults, and client-side filtering logic. |
| `audit-filters.tsx` | Search and dropdown filter controls with clear action. |
| `audit-columns.tsx` | Table columns for date, actor, action, resource, details, and outcome. |
| `audits.test.tsx` | Error/retry, search, and combined-filter tests. |

## How It Works

`AuditsPage` calls `useAuditLogs()`, applies `filterAuditLogs()` to the records provided by the API, and renders the columns and controls. Filters do not make new API requests. Route access requires `audits:read`.
