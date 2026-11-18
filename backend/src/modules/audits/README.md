# Audits

## Overview

Read-only access to recent administrative and security activity stored in the `audit_logs` table.

## Key Responsibilities

- Return a bounded set of recent audit records.
- Order results by event timestamp and ID, newest first.
- Indicate when additional records exist beyond the response limit.

## Structure

| File | Purpose |
| --- | --- |
| `repository.ts` | Exports `listAuditLogs()` and `MAX_AUDIT_LOGS` (500). |

## How It Works

`GET /api/audits` calls the repository and returns up to 500 records plus `hasMore` metadata. The endpoint is admin-only and sends `Cache-Control: no-store`.

