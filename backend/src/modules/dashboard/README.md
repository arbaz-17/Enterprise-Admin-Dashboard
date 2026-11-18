# Dashboard Operations

## Overview

Database-backed operational summaries used by the dashboard's `/operations` endpoint.

## Key Responsibilities

- Calculate overdue/due-soon project counts and average active-project progress.
- Return project-priority and employee-status distributions.
- Identify up to five projects needing attention.
- Limit detailed project information according to the user's role.

## Structure

| File | Purpose |
| --- | --- |
| `operations.ts` | Exports `getOperationsOverview()` and its SQL aggregation helpers. |

## How It Works

`getOperationsOverview(role)` runs four independent queries in parallel. Projects may be flagged as overdue, due soon, on hold, or unassigned. Viewers receive aggregate results but no named attention projects because they lack `projects:read`.