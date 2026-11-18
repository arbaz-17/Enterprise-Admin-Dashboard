# Projects

## Overview

Project CRUD, lifecycle validation, manager-level editing, and database operations.

## Key Responsibilities

- List/filter projects and fetch details or form options.
- Validate client and manager eligibility, project dates, progress, and status.
- Enforce role- and project-specific editing rules.
- Maintain completion timestamps when projects enter/leave `completed` status.

## Structure

| File | Purpose |
| --- | --- |
| `schemas.ts` | Zod filters, project fields, and distinct admin/manager update schemas. |
| `repository.ts` | Drizzle list/detail/CRUD queries, option lookups, and guarded updates. |
| `services.ts` | Reference checks, date/progress validation, and completion-time logic. |
| `access.ts` | Resolves active employee-to-user linkage and `actorCanEdit()` ownership. |

## How It Works

Admins can create, fully edit, and delete projects. Managers can edit **status and progress only** on projects where their active linked employee is the assigned manager; the repository also guards the update query. Completed projects require 100% progress. Clients must be active, and project managers must be eligible active employees linked to admin/manager accounts.

