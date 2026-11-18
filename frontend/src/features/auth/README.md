# Authentication & Authorization

## Overview

Frontend login, session lifecycle, role-based permissions, and protected navigation. Used by the login page, route guards, and permission-aware UI.

## Key Responsibilities

- Sign in and sign out; restore an existing session on startup.
- Keep the access token in memory and refresh it when needed.
- Expose the current user, auth status, permissions, and session actions through context.
- Redirect unauthenticated visitors and show a forbidden state for restricted routes.

## Structure

| File | Purpose |
| --- | --- |
| `auth-api.ts` | Login, logout, `/auth/me`, refresh, and deduplicated session restoration. |
| `auth-context.ts` | Authentication context and state/action contract. |
| `auth-provider.tsx` | Session state, startup restoration, 401 refresh/retry interceptor, and cache clearing. |
| `auth.types.ts` | User roles, permission strings, and authentication response types. |
| `protected-route.tsx` | Loading/retry states, login redirect, and permission-denied screen. |
| `login-form.tsx` | Sign-in form, validation feedback, and API error handling. |
| `login.schema.ts` | Zod email/password validation. |
| `login.utils.ts` | Safe post-login redirect path handling. |
| `login-brand-panel.tsx` | Branding panel for the sign-in screen. |
| `login-demo-accounts.tsx` | Demo role selectors that fill sign-in credentials. |
| `auth.test.tsx` | Form validation, login errors, redirects, and forbidden-route coverage. |
| `auth-session.test.tsx` | Session restoration, logout, and permission-aware sidebar tests. |

## How It Works

`AuthProvider` restores the session through the refresh endpoint, then supplies `useAuth()` via context. Protected API calls use `apiClient`; on a 401, the provider attempts a token refresh and retries once. `ProtectedRoute` checks auth state and optional permissions. **Backend authorization remains authoritative**; hiding UI controls is not a security boundary.
