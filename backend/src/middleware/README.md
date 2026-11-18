# Middleware

## Overview

Reusable Express request guards and handlers applied in `app.ts` or individual routers.

## Key Responsibilities

- Authenticate active users and enforce role permissions.
- Validate request origin for state-changing endpoints.
- Normalize unknown routes and unexpected server errors.

## Structure

| File | Purpose |
| --- | --- |
| `require-auth.ts` | Verifies the bearer JWT, loads the active user, and sets `req.authUser`. |
| `require-permission.ts` | Returns 403 when the current role lacks a named permission. |
| `trusted-origin.ts` | Requires the `Origin` (or fallback `Referer`) to match `FRONTEND_ORIGIN`. |
| `not-found.ts` | Returns a consistent JSON 404 for unmatched routes. |
| `error-handler.ts` | Handles invalid/oversized JSON bodies and unexpected 500 errors. |

## How It Works

Protected routers call `requireAuth` before `requirePermission`. POST/PATCH/DELETE endpoints also apply `requireTrustedOrigin` where implemented. `app.ts` registers the not-found and error handlers last. 


