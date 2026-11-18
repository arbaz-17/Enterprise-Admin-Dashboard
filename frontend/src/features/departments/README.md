# Departments

## Overview

Department directory and management for the `/departments` page.

## Key Responsibilities

- Search, sort, and paginate department records through the backend.
- Create, edit, and delete departments using validated forms.
- Keep dependent employee, team, and dashboard views up to date.

## Structure

| File | Purpose |
| --- | --- |
| `departments-api.ts` | Department list and create/update/delete requests. |
| `departments.queries.ts` | List query, CRUD mutations, and related cache invalidation. |
| `departments.types.ts` | Department, input, and paginated-response types. |
| `department-form-dialog.tsx` | Add/edit dialog and submission feedback. |
| `department-form.schema.ts` | Name and description validation rules. |
| `department-form.helpers.ts` | Defaults and form-to-request conversion. |
| `department-columns.tsx` | Department table columns and actions. |
| `departments.test.tsx` | Search/pagination, delete confirmation, and read-only permission tests. |

## How It Works

`DepartmentsPage` uses `useDepartments()` for server-side lists and mutation hooks for writes. The form edits name and description; `headEmployeeId` exists in the returned model but is not edited here. Successful mutations invalidate departments, dashboard, employees, and project-team caches. Management actions require `departments:manage`.
