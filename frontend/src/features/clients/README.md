# Clients

## Overview

Client organization management for the `/clients` directory, including contact details and active/inactive status.

## Key Responsibilities

- List, search, filter, sort, and paginate clients via the backend.
- Create, edit, and delete client records through validated dialogs.
- Refresh client, project, and dashboard data after successful changes.

## Structure

| File | Purpose |
| --- | --- |
| `client.api.ts` | Client list and create/update/delete API requests. |
| `clients.queries.ts` | Query hooks, mutation hooks, and cache invalidation. |
| `clients.types.ts` | Client, request, response, and list-filter types. |
| `client-form-dialog.tsx` | Create/edit dialog using React Hook Form. |
| `client-form.schema.ts` | Zod rules for name, contact details, and status. |
| `client-form.helpers.ts` | Default form values and API payload conversion. |
| `client-columns.tsx` | Table columns and row actions. |
| `clients.test.tsx` | Status filtering, invalid form, and create/refresh tests. |

## How It Works

`ClientsPage` connects table state and filters to `useClients()`; create/update/delete mutations call `clientsApi`. The form allows optional contact fields and validates email. Mutations invalidate clients, dashboard, and projects query caches. Editing controls depend on the relevant client-management permission.
