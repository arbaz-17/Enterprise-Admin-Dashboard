# Dashboard

## Overview

Data and feature-specific presentation components for the main dashboard (`/`): KPIs, trends, operational health, distribution charts, and recent projects.

## Key Responsibilities

- Fetch dashboard sections independently for responsive loading and refresh.
- Show operational insights and project/employee distribution charts.
- Handle loading, initial failure/retry, and failed background refresh per widget.

## Structure

| File | Purpose |
| --- | --- |
| `dashboard-api.ts` | Six dashboard endpoints: metrics, monthly activity, project status, departments, recent projects, and operations. |
| `dashboard.queries.ts` | Separate TanStack Query keys/hooks for each endpoint. |
| `dashboard.types.ts` | Typed metrics, chart data, recent projects, and operations responses. |
| `dashboard-widget.tsx` | Generic widget handling skeletons, errors, retry, and previously loaded data. |
| `operations-overview.tsx` | Operational health summary, attention items, and loading skeleton. |
| `operations-distribution-charts.tsx` | Project priority and employee status charts. |
| `recent-projects.tsx` | Recent-project listing. |
| `dashboard-metrics.test.tsx` | Dashboard metric error/retry integration test. |

## How It Works

`DashboardPage` composes these hooks and components with shared charts/cards in `src/components/dashboard/`. Queries run independently, so one failed section need not block the rest; a failed background refresh can continue displaying cached data. Route access requires `dashboard:read`.
