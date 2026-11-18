# Users & Roles

## Overview

User account administration for `/users`: view accounts, change roles, and activate or deactivate access.

## Key Responsibilities

- Fetch a searchable, paginated user directory.
- Confirm role and account-status changes before updating the backend.
- Prevent self-management actions in the account table.

## Structure

| File | Purpose |
| --- | --- |
| `users-api.ts` | User types plus list and role/status PATCH requests. |
| `users.queries.ts` | Directory query, update mutation, and related cache invalidation. |
| `users.helpers.ts` | Role labels and confirmation text/payload builders. |
| `user-table.tsx` | Account table, role selector, status toggle, and loading rows. |
| `users.test.tsx` | Self-edit restriction, role confirmation, and deactivation tests. |

## How It Works

`UsersPage` loads accounts through `useUsers()` and asks for confirmation before `useUpdateUser()` changes `role` or `isActive`. The table disables changes to the signed-in user's own account. A successful update refreshes users, employees, and project-form options. The route requires `users:manage`; the backend validates the actual write.
