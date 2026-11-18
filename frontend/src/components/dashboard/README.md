# Dashboard Components

## Overview

Reusable dashboard visualizations and data-table building blocks shared across dashboard and list pages. Charts use Recharts; tables use TanStack Table and optionally TanStack Virtual.

## Key Responsibilities

- Render dashboard KPIs and project/department charts with corresponding loading placeholders.
- Provide sortable tables with column visibility, search controls, and pagination.
- Keep list-page sorting, pagination, and filter state synchronized with URL query parameters.
- Defer offscreen charts and optionally virtualize larger tables to reduce rendering work.

## Structure

| File | Purpose |
| --- | --- |
| `dashboard-charts.tsx` | Monthly project activity, project status, and department charts. |
| `dashboard-skeleton.tsx` | Skeletons for cards, charts, recent projects, and the dashboard page. |
| `stat-card.tsx` | Reusable KPI card with an icon, value, and description. |
| `deferred-chart.tsx` | IntersectionObserver-based deferred rendering with a Suspense fallback. |
| `data-table.tsx` | Generic table; client-side sorting or controlled server-side sorting/pagination, optional virtualization, and loading/empty states. |
| `data-table-header.tsx` | Accessible sortable column headers. |
| `data-table-toolbar.tsx` | Search input with 350 ms debounce, filter controls, and clear action. |
| `data-table-column-visibility.tsx` | Dropdown for showing or hiding table columns. |
| `data-table-pagination.tsx` | Page size selection, record count, and previous/next controls. |
| `table-url-state.ts` | Validated URL state for page, page size, sorting, and filters. |
| `table-url-state.test.ts` | Vitest tests for URL table-state behavior. |

## How It Works

List pages pass columns and records to `DataTable`. For server-paginated lists, pages control sorting, page, and page size; `getTableUrlState` reads and updates these values in the URL. Virtualization is opt-in and activates only for at least 50 rendered rows. Chart data and feature-specific queries are supplied by the consuming pages/features rather than fetched here.
