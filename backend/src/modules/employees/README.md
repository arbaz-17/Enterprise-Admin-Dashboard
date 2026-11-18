# Employees

## Overview

Employee records, department membership, optional user-account linking, and associated validation.

## Key Responsibilities

- Provide searchable, filterable, sortable, paginated employee records.
- Create, retrieve, edit, and delete employees.
- Offer eligible account-linking options and validate linked references.
- Surface duplicate email, relationship, and in-use conflicts.

## Structure

| File | Purpose |
| --- | --- |
| `schemas.ts` | Validates employee IDs, list filters, status, dates, and form fields. |
| `repository.ts` | Drizzle list/detail/CRUD queries, account options, and reference lookups. |
| `services.ts` | Checks that departments exist and linked users are active. |

## How It Works

`/api/employees` uses Zod schemas then checks referenced records before writes. Employees must belong to a department; a linked user is optional but must be active. Employee statuses are `active`, `on_leave`, and `inactive`. Deletions can fail when other records still reference an employee.
