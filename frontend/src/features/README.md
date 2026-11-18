# Features

## Overview

Domain-specific frontend modules for the Enterprise Administration Dashboard. Each feature owns its API calls, query hooks, types, UI behavior, and relevant tests. Route-level screens in `src/pages/` compose these modules.

## Feature Directory

| Feature | Purpose | Documentation |
| --- | --- | --- |
| `audits/` | View and filter activity and security audit records. | [Audits](./audits/README.md) |
| `auth/` | Login, session restoration, permissions, and route protection. | [Authentication](./auth/README.md) |
| `clients/` | Client directory, forms, and CRUD operations. | [Clients](./clients/README.md) |
| `dashboard/` | KPI data, operational insights, charts, and recent projects. | [Dashboard](./dashboard/README.md) |
| `departments/` | Department directory and CRUD operations. | [Departments](./departments/README.md) |
| `employees/` | Employee directory, department and account linking, and CRUD. | [Employees](./employees/README.md) |
| `projects/` | Project directory, editing, progress updates, and form options. | [Projects](./projects/README.md) |
| `team-assignments/` | Project team membership and eligible employee lookup. | [Team Assignments](./team-assignments/README.md) |
| `users/` | User directory, role changes, and account activation. | [Users & Roles](./users/README.md) |

## Conventions

- API modules use the shared `src/lib/api-client.ts` client.
- `*.queries.ts` modules manage TanStack Query keys, fetching, mutations, and cache updates.
- Form schemas use Zod; form dialogs use React Hook Form where applicable.
- `*.test.tsx` files contain feature-level Vitest/React Testing Library tests with MSW mocks.
- Pages and the backend enforce access at their respective boundaries; frontend permissions only control UI and navigation.
