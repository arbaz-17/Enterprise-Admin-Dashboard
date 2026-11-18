# Employees

## Overview

Employee directory and records for `/employees`, including department affiliation, employment status, and optional dashboard account linking.

## Key Responsibilities

- Search, filter, sort, and paginate employee records via the backend.
- Create, edit, and delete employees using validated form data.
- Populate department and eligible account selections; refresh related views after writes.

## Structure

| File | Purpose |
| --- | --- |
| `employees-api.ts` | Employee CRUD requests and available account options. |
| `employees.queries.ts` | List/account queries, mutations, and dependent cache invalidation. |
| `employees.types.ts` | Employee, status, form payload, filter, and account-option types. |
| `employee-form-dialog.tsx` | Add/edit form with department and linked-account selectors. |
| `employee-form.schema.ts` | Name, email, designation, department, status, and date validation. |
| `employee-form.helpers.ts` | Form defaults and nullable-field conversion. |
| `employee.constants.ts` | Allowed employment statuses and display labels. |
| `employee-columns.tsx` | Employee table columns, status badges, and actions. |
| `employees.test.tsx` | List/error/retry, read-only access, and invalid-form tests. |
| `employee-create.test.tsx` | Successful creation and table refresh test. |

## How It Works

`EmployeesPage` uses `useEmployees()` for the table. The form loads departments and account options, then submits through create/update mutations. Statuses are `active`, `on_leave`, and `inactive`. Successful writes invalidate employee, dashboard, project, and team caches. Management actions require `employees:manage`.
