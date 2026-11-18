# Users

## Overview

User-directory queries and controlled administration of account roles and activation status.

## Key Responsibilities

- List users with search and pagination, without exposing password hashes.
- Update another user's role and/or active status.
- Prevent administrator self-modification and removal of the last active admin.
- Revoke active refresh sessions when a user is deactivated.

## Structure

| File | Purpose |
| --- | --- |
| `schemas.ts` | Validates user IDs, filters, role values, and update requests. |
| `repository.ts` | Public-field queries and transactional account updates. |
| `services.ts` | Applies business rules and returns typed update outcomes. |

## How It Works

`GET /api/users` is available to admins and managers; `PATCH /api/users/:id` is admin-only. Updates execute within a transaction so the last-admin check, account change, and session revocation remain consistent. The API supports account administration, **not user creation or deletion**.
