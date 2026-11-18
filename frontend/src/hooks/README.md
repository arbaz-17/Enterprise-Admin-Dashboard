# Hooks

## Overview
Shared React hooks used across the frontend for authentication state and responsive layout behavior.

## Key Responsibilities
- Provide safe access to the application's authentication context.
- Detect whether the viewport is below the mobile breakpoint.

## Files
- `use-auth.ts` — Exports `useAuth()`, which returns the current `AuthContext` (user, permissions, session status, and auth actions). Throws if called outside `AuthProvider`.
- `use-mobile.ts` — Exports `useIsMobile()`, which tracks viewport width using `matchMedia` and returns `true` below **768px**.

## Usage Notes
- `useAuth()` requires `AuthProvider`, configured in `src/main.tsx`. Used by protected routes, pages, and layout components.
- `useIsMobile()` is used by the shared sidebar to adapt its layout; it registers and cleans up a media-query change listener.
