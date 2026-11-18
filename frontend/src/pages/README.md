# Pages

## Overview

Route-level screens for the Enterprise Administration Dashboard. Each page assembles feature components, query hooks, and shared UI into a complete screen; reusable business logic lives primarily in `src/features/`.

## Key Responsibilities

- Render application screens and coordinate page-level interactions.
- Handle loading, error, empty, and mutation-feedback states.
- Apply permission-aware controls while route guards enforce page access.
- Coordinate search, filters, sorting, pagination, and dialogs where needed.

## Pages and Routes

| File | Route | Purpose | Required route permission |
| --- | --- | --- | --- |
| `login-page.tsx` | `/login` | Login screen, session check, and redirect after authentication. | Public |
| `dashboard-page.tsx` | `/` | KPI cards, charts, operational insights, recent projects, and dashboard refresh. | `dashboard:read` |
| `departments-page.tsx` | `/departments` | Search and manage department records. | `departments:read` |
| `employees-page.tsx` | `/employees` | Manage employee records, statuses, and department assignments. | `employees:read` |
| `clients-page.tsx` | `/clients` | Manage client organizations and account status. | `clients:read` |
| `projects-page.tsx` | `/projects` | Manage projects, statuses, priorities, and progress. | `projects:read` |
| `project-team-page.tsx` | `/projects/:projectId/team` | View project members and add or remove assignments. | `projects:read` |
| `users-page.tsx` | `/users` | Search user accounts and change roles or account status. | `users:manage` |
| `audits-page.tsx` | `/audits` | Browse and filter audit events; compare virtualized/non-virtualized rendering. | `audits:read` |

## How It Works

- **Routing:** `src/App.tsx` lazily imports these pages. Authenticated pages render inside `AppLayout` and `ProtectedRoute` permission checks.
- **Data:** Pages use query and mutation hooks from their corresponding `src/features/<feature>/` modules; shared tables, dialogs, and state components come from `src/components/`.
- **Tables:** Departments, employees, clients, and projects synchronize search/filter, sorting, and pagination state with URL parameters using `getTableUrlState`. Audit filters and the users directory use local React state instead.
- **Permissions:** Read access does not automatically permit edits. Management actions are controlled by relevant permissions; project-team changes additionally require `assignments:manage` and the project's `canManageTeam` flag. The backend remains the final authority.
- **Performance:** Routes are code-split, dashboard sections fetch independently, and several data-heavy tables support row virtualization.

