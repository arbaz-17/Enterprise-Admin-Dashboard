# Configuration

## Overview

Central configuration for environment-dependent settings and server-enforced role permissions.

## Key Responsibilities

- Validate required server configuration at startup.
- Define allowed roles, permission names, and their mappings.
- Provide a shared permission check for middleware and feature logic.

## Structure

| File | Purpose |
| --- | --- |
| `env.ts` | Parses `.env` / `process.env` with Zod (`NODE_ENV`, `PORT`, `FRONTEND_ORIGIN`, `DATABASE_URL`, `JWT_ACCESS_SECRET`). |
| `permissions.ts` | Defines `admin`, `manager`, and `viewer` permission rules; exports `hasPermission()` and `getPermissions()`. |

## How It Works

`env.ts` fails fast on missing/invalid required values; the JWT secret must be at least 32 characters. `permissions.ts` is used by `requirePermission()` and to return permissions during authentication. Additional project-ownership restrictions are enforced by project and assignment services.
