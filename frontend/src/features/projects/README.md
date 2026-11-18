# Projects

## Overview

Project directory and management for `/projects`, including client/manager assignment, status, priority, progress, and dates.

## Key Responsibilities

- Search, filter, sort, and paginate projects through the backend.
- Create, edit, and delete projects; load client/manager choices for forms.
- Support limited status/progress updates for eligible assigned managers.

## Structure

| File | Purpose |
| --- | --- |
| `projects-api.ts` | Project list, form options, and create/update/delete requests. |
| `projects.queries.ts` | Query/mutation hooks and dashboard/team cache invalidation. |
| `projects.types.ts` | Project, permissions flag, form inputs, and list/option response types. |
| `project-form-dialog.tsx` | Full create/edit dialog for project details. |
| `project-form.schema.ts` | Full form and status/progress Zod schemas. |
| `project-form.helpers.ts` | Form defaults, payload mapping, and progress defaults. |
| `project-progress-dialog.tsx` | Narrow dialog for changing status and progress. |
| `project.constants.ts` | Project statuses, priorities, and status labels. |
| `project-columns.tsx` | Table columns, progress display, row actions, and team links. |
| `projects.test.tsx` | Search/filter behavior and assigned-manager update restrictions. |

## How It Works

`ProjectsPage` uses server-paginated queries, management dialogs, and permissions combined with each project's `canEdit` flag. The progress form changes only `status` and `progress`. Validation requires completed projects to have 100% progress and prevents due dates before start dates. Project mutations refresh project lists, dashboard data, and project-team caches. Team membership itself is managed in `../team-assignments/`.
